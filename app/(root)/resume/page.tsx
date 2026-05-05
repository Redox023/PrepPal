import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth.action";
import ResumeAnalyzer from "@/components/ResumeAnalyzer";

export default async function ResumePage() {
  const user = await getCurrentUser();
  if (!user || !user.id) redirect("/sign-in");

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 max-w-2xl">
        <h2>Resume Review</h2>
        <p className="text-lg">
          Upload your resume and get AI-powered feedback on ATS compatibility,
          job match, writing, keywords, and more.
        </p>
      </div>
      <ResumeAnalyzer />
    </section>
  );
}
