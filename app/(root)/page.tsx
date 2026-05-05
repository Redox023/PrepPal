import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  claimUnassignedInterviews,
} from "@/lib/actions/general.action";

const interviewTemplates = [
  {
    role: "Frontend",
    type: "Technical",
    techstack: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
    description: "React, Next.js, performance, accessibility, state management.",
  },
  {
    role: "Backend",
    type: "Technical",
    techstack: ["Node.js", "PostgreSQL", "Express", "Redis"],
    description: "APIs, databases, scalability, caching, system design basics.",
  },
  {
    role: "Full Stack",
    type: "Mixed",
    techstack: ["React", "Node.js", "MongoDB", "TypeScript"],
    description: "End-to-end app design, frontend + backend trade-offs.",
  },
  {
    role: "Machine Learning",
    type: "Technical",
    techstack: ["Python", "TensorFlow", "PyTorch", "scikit-learn"],
    description: "Models, training pipelines, evaluation, deployment.",
  },
  {
    role: "DevOps",
    type: "Technical",
    techstack: ["Docker", "Kubernetes", "AWS", "Terraform"],
    description: "CI/CD, infra-as-code, observability, incident response.",
  },
  {
    role: "Mobile",
    type: "Technical",
    techstack: ["React Native", "Swift", "Kotlin"],
    description: "iOS/Android, native vs cross-platform, performance.",
  },
];

async function Home() {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    redirect("/sign-in");
  }

  await claimUnassignedInterviews(user.id);

  const userInterviews = await getInterviewsByUserId(user.id);
  const hasPastInterviews = (userInterviews?.length ?? 0) > 0;

  return (
    <>
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Practice real interview questions & get instant feedback
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="btn-primary max-sm:w-full">
              <Link href="/interview">Start an Interview</Link>
            </Button>
            <Button asChild variant="outline" className="max-sm:w-full">
              <Link href="/resume">Analyze My Resume</Link>
            </Button>
          </div>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Your Interviews</h2>

        <div className="interviews-section">
          {hasPastInterviews ? (
            userInterviews?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>You haven&apos;t taken any interviews yet</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Take Interviews</h2>
        <p className="text-muted-foreground -mt-3 text-sm">
          Pick a track and start a voice interview tailored to that role.
        </p>

        <div className="interviews-section">
          {interviewTemplates.map((tpl) => (
            <div
              key={tpl.role}
              className="card-border w-[360px] max-sm:w-full min-h-72"
            >
              <div className="card-interview">
                <div>
                  <div className="absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg bg-light-600">
                    <p className="badge-text">{tpl.type}</p>
                  </div>
                  <h3 className="mt-5 capitalize">{tpl.role} Interview</h3>
                  <p className="text-xs text-muted-foreground mt-2">
                    {tpl.techstack.join(" • ")}
                  </p>
                  <p className="line-clamp-3 mt-4">{tpl.description}</p>
                </div>

                <div className="flex flex-row justify-end mt-4">
                  <Button asChild className="btn-primary">
                    <Link href="/interview">Start</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default Home;
