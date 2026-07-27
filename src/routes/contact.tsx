import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Mail, MessageCircle, Phone } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicSiteData } from "@/lib/public.functions";

const siteDataQuery = queryOptions({
  queryKey: ["public-site-data"],
  queryFn: () => getPublicSiteData(),
  staleTime: 5 * 60 * 1000,
});

export const Route = createFileRoute("/contact")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteDataQuery),
  head: () => ({
    meta: [
      { title: "Contact SIWES Writer — Support & Enquiries" },
      {
        name: "description",
        content:
          "Reach the SIWES Writer team for payment verification, account help or general questions about your industrial training reports.",
      },
      { property: "og:title", content: "Contact SIWES Writer" },
      {
        property: "og:description",
        content: "Get help with payments, your account, or your SIWES reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data } = useSuspenseQuery(siteDataQuery);
  const email = data.settings.support_email ?? "support@siweswriter.com";
  const whatsapp = data.settings.support_whatsapp ?? "";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-gradient-soft">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <h1 className="text-4xl font-extrabold text-foreground sm:text-5xl">Get in touch</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Questions about payment, activation or your reports? We're here to help.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Card className="shadow-soft">
              <CardContent className="pt-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Mail className="size-5" />
                </span>
                <h2 className="mt-4 font-semibold text-foreground">Email us</h2>
                <a
                  href={`mailto:${email}`}
                  className="mt-1 block break-all text-sm text-primary hover:underline"
                >
                  {email}
                </a>
                <p className="mt-2 text-sm text-muted-foreground">
                  Best for payment receipts and account issues.
                </p>
              </CardContent>
            </Card>

            {whatsapp ? (
              <Card className="shadow-soft">
                <CardContent className="pt-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <MessageCircle className="size-5" />
                  </span>
                  <h2 className="mt-4 font-semibold text-foreground">WhatsApp</h2>
                  <a
                    href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm text-primary hover:underline"
                  >
                    {whatsapp}
                  </a>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Fastest way to get your payment verified.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-soft">
                <CardContent className="pt-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Phone className="size-5" />
                  </span>
                  <h2 className="mt-4 font-semibold text-foreground">Response time</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We review payments and reply to messages within a few hours on weekdays.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
