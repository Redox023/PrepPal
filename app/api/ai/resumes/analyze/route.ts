import { getCurrentUser } from "@/lib/actions/auth.action";
import { analyzeResumeForJob } from "@/services/ai/resumes/ai";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("You are not logged in", { status: 401 });
  }

  const formData = await req.formData();
  const resumeFile = formData.get("resumeFile") as File | null;
  const description = (formData.get("description") as string) || "";
  const experienceLevel =
    (formData.get("experienceLevel") as string) || "Mid-level";
  const title = (formData.get("title") as string) || "";

  if (!resumeFile || !description.trim()) {
    return new Response("Missing resume or job description", { status: 400 });
  }

  if (resumeFile.size > MAX_FILE_SIZE) {
    return new Response("File size exceeds 10MB limit", { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(resumeFile.type)) {
    return new Response("Please upload a PDF, Word document, or text file", {
      status: 400,
    });
  }

  try {
    const res = await analyzeResumeForJob({
      resumeFile,
      jobInfo: { title, experienceLevel, description },
    });
    return res.toTextStreamResponse();
  } catch (err) {
    console.error("Resume analysis error:", err);
    return new Response("Failed to analyze resume", { status: 500 });
  }
}
