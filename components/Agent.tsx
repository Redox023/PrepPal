"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi, isVapiConfigured } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import {
  createFeedback,
  claimUnassignedInterviews,
} from "@/lib/actions/general.action";
import { toast } from "sonner";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const feedbackRequestedRef = useRef(false);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: unknown) => {
      const err = error as {
        message?: string;
        errorMsg?: string;
        error?: { message?: string; type?: string; error?: { type?: string } };
        type?: string;
      };

      const innerType = err?.error?.error?.type || err?.error?.type;
      if (err?.type === "daily-error" && innerType === "ejected") {
        return;
      }

      console.error("[Vapi] Error (raw):", error);
      try {
        console.error(
          "[Vapi] Error (json):",
          JSON.stringify(error, Object.getOwnPropertyNames(error ?? {}), 2)
        );
      } catch {}
      const msg =
        err?.message ||
        err?.errorMsg ||
        err?.error?.message ||
        err?.error?.type ||
        err?.type ||
        "Unknown error";
      toast.error(`Voice agent error: ${msg}`);
      setCallStatus(CallStatus.INACTIVE);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("handleGenerateFeedback");

      if (messages.length === 0) {
        toast.error("No transcript captured. Try the interview again.");
        return;
      }

      const result = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      });

      if (result.success && result.feedbackId) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        const errMsg =
          "error" in result && result.error
            ? result.error
            : "Could not generate feedback";
        console.error("Error saving feedback:", errMsg);
        toast.error(`Feedback generation failed: ${errMsg}`);
      }
    };

    const handleClaimAndRedirect = async () => {
      try {
        if (userId) {
          const res = await claimUnassignedInterviews(userId);
          if (res.success && res.claimed > 0) {
            toast.success(`Saved ${res.claimed} interview${res.claimed > 1 ? "s" : ""} to your history.`);
          }
        }
      } catch (e) {
        console.error("[claimUnassignedInterviews] failed:", e);
      } finally {
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        if (!feedbackRequestedRef.current) {
          feedbackRequestedRef.current = true;
          handleClaimAndRedirect();
        }
      } else if (!feedbackRequestedRef.current) {
        feedbackRequestedRef.current = true;
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    // Guard 1: Vapi token missing
    if (!isVapiConfigured()) {
      toast.error(
        "Vapi is not configured. Set NEXT_PUBLIC_VAPI_WEB_TOKEN in your env."
      );
      return;
    }

    // Guard 2: Workflow id required for "generate" type
    if (type === "generate" && !process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID) {
      toast.error(
        "Vapi workflow id missing. Set NEXT_PUBLIC_VAPI_WORKFLOW_ID."
      );
      return;
    }

    // Guard 3: ask mic permission upfront — silent failure here is the #1 cause of "voice not working"
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop()); // we only needed the permission grant
    } catch (err) {
      console.error("[Vapi] Microphone permission denied:", err);
      toast.error(
        "Microphone permission denied. Allow mic access in your browser."
      );
      return;
    }

    setCallStatus(CallStatus.CONNECTING);

    try {
      if (type === "generate") {
        await vapi.start(
          undefined,
          undefined,
          undefined,
          process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!,
          {
            variableValues: {
              username: userName,
              userid: userId,
            },
          }
        );
      } else {
        let formattedQuestions = "";
        if (questions) {
          formattedQuestions = questions
            .map((question) => `- ${question}`)
            .join("\n");
        }

        const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
        if (assistantId) {
          await vapi.start(assistantId, {
            variableValues: {
              questions: formattedQuestions,
            },
          });
        } else {
          await vapi.start(interviewer, {
            variableValues: {
              questions: formattedQuestions,
            },
          });
        }
      }
    } catch (err) {
      console.error("[Vapi] Failed to start call:", err);
      toast.error(
        "Could not start the voice call. Check your Vapi dashboard configuration."
      );
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={() => handleCall()}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
