import { Search, UserCheck, Bell } from "lucide-react";
import { Disclaimer } from "@/components/common/Disclaimer";

export const metadata = { title: "How It Works — WorkNow Korea" };

export default function HowItWorksPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">How WorkNow Korea works</h1>
      <p className="mt-2 text-muted-foreground">
        We are a job information platform. Employers and workers contact each
        other directly — we do not employ, dispatch, or supervise anyone.
      </p>

      <div className="mt-10 space-y-8">
        {[
          {
            icon: Search,
            title: "For workers",
            points: [
              "Create a free profile with your city, languages, and job types.",
              "Browse a live feed of jobs near you with clear pay.",
              "Tap “I'm interested” or call the employer directly.",
              "Turn on alerts to be notified about matching jobs.",
            ],
          },
          {
            icon: UserCheck,
            title: "For employers",
            points: [
              "Post a job with location, schedule, pay, and payment timing.",
              "Your job is briefly reviewed, then goes live.",
              "Interested workers appear in your applicants list.",
              "Contact workers directly to arrange the work.",
            ],
          },
          {
            icon: Bell,
            title: "Staying safe",
            points: [
              "Verify all details directly with the other party.",
              "Never pay fees to get a job — wages flow directly to workers.",
              "Use the report button if something looks wrong.",
            ],
          },
        ].map((sec) => (
          <section key={sec.title} className="rounded-lg border p-6">
            <div className="flex items-center gap-3">
              <sec.icon className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">{sec.title}</h2>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-muted-foreground">
              {sec.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <Disclaimer className="mt-10" />
    </div>
  );
}
