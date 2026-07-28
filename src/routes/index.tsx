import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Clock3,
  FileText,
  GraduationCap,
  Layers,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";

import heroImage from "@/assets/hero-siwes.jpg";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicSiteData } from "@/lib/public.functions";

const siteDataQuery = queryOptions({
  queryKey: ["public-site-data"],
  queryFn: () => getPublicSiteData(),
  staleTime: 5 * 60 * 1000,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteDataQuery),
  head: () => ({
    meta: [
      { title: "SIWES Writer — Turn Rough Notes Into Professional Reports" },
      {
        name: "description",
        content:
          "Paste your rough SIWES notes and get a clean, professional logbook entry in seconds. Built for Nigerian students on industrial training.",
      },
      { property: "og:title", content: "SIWES Writer — Professional SIWES Reports in Seconds" },
      {
        property: "og:description",
        content:
          "AI-powered SIWES report writer for Nigerian students. Daily, weekly and monthly logbook entries, done properly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: Wand2,
    title: "It actually rewrites, not just tidies",
    body: "You know that feeling when you type something and it comes back sounding stiffer, not better? This doesn't do that. It keeps your voice, just cleaner.",
  },
  {
    icon: GraduationCap,
    title: "Knows your course",
    body: "Nursing entries don't read like Mechanical Engineering entries. Pick your department and the wording matches what your supervisor actually expects.",
  },
  {
    icon: Layers,
    title: "Daily, weekly, whatever you need",
    body: "Some placements want a line every day. Others want a Friday summary. Both work here.",
  },
  {
    icon: Clock3,
    title: "Faster than staring at a blank page",
    body: "You already did the work. This just gets it out of your head and into your logbook without the usual 20 minutes of \"how do I even start this sentence.\"",
  },
  {
    icon: BookOpenCheck,
    title: "Nothing gets lost",
    body: "Every entry you write stays in your account. If your logbook gets rained on in week 6, your reports don't disappear with it.",
  },
  {
    icon: ShieldCheck,
    title: "It won't lie for you",
    body: "If you didn't mention it, it doesn't go in. No made-up tasks, no exaggerated responsibilities — just your day, written properly.",
  },
];

const STEPS = [
  {
    title: "Say what actually happened",
    body: "Pidgin, half-sentences, no punctuation — doesn't matter. Type it the way it comes to you.",
  },
  {
    title: "Pick your department and the format",
    body: "One click. Daily entry or a weekly roll-up.",
  },
  {
    title: "Copy it into your logbook",
    body: "That's it. No editing needed, but you can tweak it if you want.",
  },
];
const STEPS = [
  {
    title: "Say what actually happened",
    body: "Pidgin, half-sentences, no punctuation — doesn't matter. Type it the way it comes to you.",
  },
  {
    title: "Pick your department and the format",
    body: "One click. Daily entry or a weekly roll-up.",
  },
  {
    title: "Copy it into your logbook",
    body: "That's it. No editing needed, but you can tweak it if you want.",
  },
];
const FALLBACK_FAQS = [
  {
    id: "f1",
    question: "How long does activation take after I pay?",
    answer:
      "Payments are reviewed manually, usually within a few hours. You'll see your account switch to active on your dashboard as soon as it's approved.",
  },
  {
    id: "f2",
    question: "Does the AI make up activities?",
    answer:
      "No. It only rewrites what you type. If you don't mention an activity, it will never appear in your report.",
  },
];

function LandingPage() {
  const { data } = useSuspenseQuery(siteDataQuery);
  const price = data.settings.price_naira ?? "2000";
  const faqs = data.faqs.length > 0 ? data.faqs : FALLBACK_FAQS;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-soft">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div>
              <Badge variant="secondary" className="mb-5 gap-1.5 rounded-full px-3 py-1">
                <Sparkles className="size-3.5 text-primary" />
                Built for Nigerian SIWES students
              </Badge>
              <h1 className="text-4xl font-extrabold leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
                Turn rough notes into a{" "}
                <span className="text-primary">professional SIWES report</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Stop struggling with what to write in your logbook. Type what you actually did
                today, and get a clean, concise entry ready to copy — in seconds.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/auth" search={{ mode: "signup", redirect: undefined }}>
                    Start writing better reports
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/" hash="how-it-works">
                    See how it works
                  </Link>
                </Button>
              </div>

              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-border pt-6">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Formats</dt>
                  <dd className="mt-1 text-xl font-bold text-foreground">3</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Departments
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-foreground">
                    {data.departments.length || 50}+
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Access</dt>
                  <dd className="mt-1 text-xl font-bold text-foreground">Lifetime</dd>
                </div>
              </dl>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-border shadow-lift">
                <img
                  src={heroImage}
                  alt="Nigerian student writing an industrial training logbook next to a laptop"
                  width={1600}
                  height={1104}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Before / After */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  What you type
                </p>
                <p className="mt-3 font-mono text-sm leading-relaxed text-foreground/80">
                  "today i follow the engineer go site, we check the transformer wey dey fault,
                  after we tighten some cable then test am"
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/40 bg-primary-soft/60">
              <CardContent className="pt-6">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                  <BadgeCheck className="size-3.5" />
                  What you get
                </p>
                <p className="mt-3 text-sm leading-relaxed text-foreground">
                  Accompanied the supervising engineer on a site inspection to diagnose a faulty
                  distribution transformer. Assisted in tightening loose cable terminations and
                  participated in post-repair testing to confirm restored functionality.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Why this beats writing it yourself
              </h2>
              <p className="mt-3 text-muted-foreground">
               Not a generic AI tool wearing a SIWES costume. Built around one problem, and one problem only.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card key={feature.title} className="shadow-soft transition-shadow hover:shadow-lift">
                  <CardContent className="pt-6">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <feature.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.body}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">How it actually works</h2>
              <p className="mt-3 text-muted-foreground">
                Three steps. No tutorial needed.
              </p>
            </div>

            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="relative rounded-xl border border-border p-6">
                  <span className="flex size-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Pay once, use it till you're done with SIWES
              </h2>
              <p className="mt-3 text-muted-foreground">
                No subscriptions, no hidden charges. Pay once and use it for your entire SIWES
                placement.
              </p>
            </div>

            <Card className="mx-auto mt-10 max-w-md border-primary/40 shadow-lift">
              <CardContent className="pt-8 text-center">
                <p className="text-sm font-medium text-muted-foreground">Full access</p>
                <p className="mt-2 text-5xl font-extrabold text-foreground">
                  ₦{Number(price).toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">one-time payment</p>

                <ul className="mt-7 space-y-3 text-left text-sm">
                  {[
                    "Unlimited AI-generated reports",
                    "Daily, weekly and monthly formats",
                    "All departments supported",
                    "Full saved report history",
                    "Copy and download your reports",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <BadgeCheck className="mt-0.5 size-4 shrink-0 text-success" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild size="lg" className="mt-8 w-full">
                  <Link to="/auth" search={{ mode: "signup", redirect: undefined }}>
                    Create your account
                  </Link>
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  Pay by bank transfer, upload your receipt, and we activate your account after
                  verification.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
            <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
              Frequently asked questions
            </h2>
            <Accordion type="single" collapsible className="mt-8">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left text-base font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-primary">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
            <FileText className="mx-auto size-10 text-primary-foreground/80" />
            <h2 className="mt-4 text-3xl font-bold text-primary-foreground sm:text-4xl">
              Logbook due again? Let's knock it out.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-primary-foreground/85">
              Built by someone who was filling this same logbook not long ago.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-7">
              <Link to="/auth" search={{ mode: "signup", redirect: undefined }}>
                Get started now
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
