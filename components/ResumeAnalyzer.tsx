"use client";

import { Skeleton } from "@/components/Skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { cn } from "@/lib/utils";
import { aiAnalyzeSchema } from "@/services/ai/resumes/schemas";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { DeepPartial } from "ai";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  UploadIcon,
  XCircleIcon,
} from "lucide-react";
import { ReactNode, useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";

export default function ResumeAnalyzer() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [title, setTitle] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Mid-level");
  const [description, setDescription] = useState("");
  const fileRef = useRef<File | null>(null);

  const {
    object: aiAnalysis,
    isLoading,
    submit: generateAnalysis,
  } = useObject({
    api: "/api/ai/resumes/analyze",
    schema: aiAnalyzeSchema,
    fetch: (url, options) => {
      const headers = new Headers(options?.headers);
      headers.delete("Content-Type");

      const formData = new FormData();
      if (fileRef.current) {
        formData.append("resumeFile", fileRef.current);
      }
      formData.append("title", title);
      formData.append("experienceLevel", experienceLevel);
      formData.append("description", description);

      return fetch(url, { ...options, headers, body: formData });
    },
    onError: (err) => {
      console.error("Resume analysis error:", err);
      toast.error(
        err?.message?.includes("quota") || err?.message?.includes("429")
          ? "Gemini API quota exceeded. Use a new API key or enable billing."
          : `Analysis failed: ${err?.message || "Unknown error"}`
      );
    },
  });

  const isReadyForUpload = description.trim().length > 0;

  function handleFileUpload(file: File | null) {
    if (file == null) return;

    if (!isReadyForUpload) {
      toast.error(
        "Please paste the job description above before uploading your resume."
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF, Word document, or text file");
      return;
    }

    fileRef.current = file;
    toast.success(`Uploaded ${file.name}. Analyzing...`);
    generateAnalysis(null);
  }

  return (
    <div className="space-y-8 w-full">
      <Card>
        <CardHeader>
          <CardTitle>Job Context</CardTitle>
          <CardDescription>
            Tell us about the job you&apos;re applying to so we can tailor the
            review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option>Internship</option>
                <option>Entry-level</option>
                <option>Mid-level</option>
                <option>Senior</option>
                <option>Lead/Principal</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={6}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? "Analyzing your resume" : "Upload your resume"}
          </CardTitle>
          <CardDescription>
            {isLoading
              ? "This may take a couple minutes"
              : "Get personalized feedback on your resume based on the job"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingSwap loadingIconClassName="size-16" isLoading={isLoading}>
            <div
              className={cn(
                "mt-2 border-2 border-dashed rounded-lg p-6 transition-colors relative",
                !isReadyForUpload && "opacity-60",
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/50 bg-muted/10"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                if (isReadyForUpload) setIsDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleFileUpload(e.dataTransfer.files[0] ?? null);
              }}
            >
              <label htmlFor="resume-upload" className="sr-only">
                Upload your resume
              </label>
              <input
                id="resume-upload"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                disabled={!isReadyForUpload}
                className={cn(
                  "opacity-0 absolute inset-0",
                  isReadyForUpload ? "cursor-pointer" : "cursor-not-allowed"
                )}
                onChange={(e) => {
                  handleFileUpload(e.target.files?.[0] ?? null);
                }}
              />
              <div className="flex flex-col items-center justify-center text-center gap-4">
                <UploadIcon className="size-12 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg">
                    {isReadyForUpload
                      ? "Drag your resume here or click to upload"
                      : "Add a job description above to enable upload"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: PDF, Word docs, and text files (max 10MB)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!isReadyForUpload}
                >
                  Choose File
                </Button>
              </div>
            </div>
          </LoadingSwap>
        </CardContent>
      </Card>

      <AnalysisResults aiAnalysis={aiAnalysis} isLoading={isLoading} />
    </div>
  );
}

type Keys = Exclude<keyof z.infer<typeof aiAnalyzeSchema>, "overallScore">;

function AnalysisResults({
  aiAnalysis,
  isLoading,
}: {
  aiAnalysis: DeepPartial<z.infer<typeof aiAnalyzeSchema>> | undefined;
  isLoading: boolean;
}) {
  if (!isLoading && aiAnalysis == null) return null;

  const sections: Record<Keys, string> = {
    ats: "ATS Compatibility",
    jobMatch: "Job Match",
    writingAndFormatting: "Writing and Formatting",
    keywordCoverage: "Keyword Coverage",
    other: "Additional Insights",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Results</CardTitle>
        <CardDescription>
          {aiAnalysis?.overallScore == null ? (
            <Skeleton className="w-32" />
          ) : (
            `Overall Score: ${aiAnalysis.overallScore}/10`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple">
          {Object.entries(sections).map(([key, title]) => {
            const category = aiAnalysis?.[key as Keys];
            return (
              <AccordionItem value={title} key={key}>
                <AccordionTrigger>
                  <CategoryAccordionHeader
                    title={title}
                    score={category?.score}
                  />
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="text-muted-foreground">
                      {category?.summary == null ? (
                        <span className="space-y-2">
                          <Skeleton />
                          <Skeleton className="w-3/4" />
                        </span>
                      ) : (
                        category.summary
                      )}
                    </div>
                    <div className="space-y-3">
                      {category?.feedback == null ? (
                        <>
                          <Skeleton className="h-16" />
                          <Skeleton className="h-16" />
                          <Skeleton className="h-16" />
                        </>
                      ) : (
                        category.feedback.map((item, index) => {
                          if (item == null) return null;
                          return <FeedbackItem key={index} {...item} />;
                        })
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function CategoryAccordionHeader({
  title,
  score,
}: {
  title: string;
  score: number | undefined | null;
}) {
  let badge: ReactNode;
  if (score == null) {
    badge = <Skeleton className="w-16" />;
  } else if (score >= 8) {
    badge = <Badge>Excellent</Badge>;
  } else if (score >= 6) {
    badge = <Badge variant="secondary">Ok</Badge>;
  } else {
    badge = <Badge variant="destructive">Needs Work</Badge>;
  }

  return (
    <div className="flex items-start justify-between w-full">
      <div className="flex flex-col items-start gap-1">
        <span>{title}</span>
        <div className="no-underline">{badge}</div>
      </div>
      {score == null ? <Skeleton className="w-12" /> : `${score}/10`}
    </div>
  );
}

function FeedbackItem({
  message,
  name,
  type,
}: Partial<z.infer<typeof aiAnalyzeSchema>["ats"]["feedback"][number]>) {
  if (name == null || message == null || type == null) return null;

  const getColors = () => {
    switch (type) {
      case "strength":
        return "bg-primary/10 border border-primary/50";
      case "major-improvement":
        return "bg-destructive/10 dark:bg-destructive/20 border border-destructive/50";
      case "minor-improvement":
        return "bg-yellow-500/10 border border-yellow-500/40";
      default:
        return "";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "strength":
        return <CheckCircleIcon className="size-4 text-primary" />;
      case "minor-improvement":
        return <AlertCircleIcon className="size-4 text-yellow-500" />;
      case "major-improvement":
        return <XCircleIcon className="size-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "flex items-baseline gap-3 pl-3 pr-5 py-5 rounded-lg",
        getColors()
      )}
    >
      <div>{getIcon()}</div>
      <div className="flex flex-col gap-1">
        <div className="text-base">{name}</div>
        <div className="text-muted-foreground">{message}</div>
      </div>
    </div>
  );
}
