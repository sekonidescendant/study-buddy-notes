import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Heart, Target } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About SIWES Writer — Built for Nigerian Students" },
      {
        name: "description",
        content:
          "Why we built SIWES Writer: helping Nigerian students on industrial training write clear, professional logbook entries without the stress.",
      },
      { property: "og:title", content: "About SIWES Writer" },
      {
        property: "og:description",
        content: "Helping Nigerian SIWES students write clear, professional logbook entries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  {
    icon: Target,
    title: "Accuracy over invention",
    body: "We polish your words. We never add activities you didn't do — your logbook stays honest.",
  },
  {
    icon: Compass,
    title: "Made for Nigerian courses",
    body: "From Nursing to Petroleum Engineering, the wording matches how your department actually reports.",
  },
  {
    icon: Heart,
    title: "Affordable for students",
    body: "A single, small one-time payment. No monthly subscription eating into your allowance.",
  },
];

function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-gradient-soft">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
            <h1 className="text-4xl font-extrabold text-foreground sm:text-5xl">
              We built this because logbooks are hard
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Every SIWES student knows the feeling: you did real work today, but when it's time to
              write it in the logbook, the words don't come. You end up copying a friend's entry or
              writing something too vague for your supervisor to accept.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              SIWES Writer fixes that. You describe what you did — in whatever words come naturally
              — and it returns a concise, professional entry in the right register for your
              department. Your work, properly documented.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold text-foreground">What we stand for</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {VALUES.map((value) => (
              <Card key={value.title} className="shadow-soft">
                <CardContent className="pt-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <value.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-foreground">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-secondary/40 p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground">Ready to try it?</h2>
            <p className="mt-2 text-muted-foreground">
              Create an account and write your next entry in under a minute.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to="/auth" search={{ mode: "signup", redirect: undefined }}>
                Get started
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
