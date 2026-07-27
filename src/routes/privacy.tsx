import { createFileRoute } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — SIWES Writer" },
      {
        name: "description",
        content:
          "How SIWES Writer collects, uses and protects your account details, reports and payment information.",
      },
      { property: "og:title", content: "Privacy Policy — SIWES Writer" },
      { property: "og:description", content: "How we handle your data at SIWES Writer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14 sm:px-6">
        <h1 className="text-4xl font-extrabold text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">Information we collect</h2>
            <p className="mt-2">
              We collect the name, email address, phone number and department you provide when you
              create an account, the report notes you submit, and the payment details and receipt
              you upload when requesting activation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">How we use your information</h2>
            <p className="mt-2">
              Your details are used to operate your account, generate and store your reports, verify
              your payment, and respond to support requests. We do not sell your information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Report content and AI</h2>
            <p className="mt-2">
              The notes you submit are sent to an AI provider solely to produce your rewritten
              report. Your reports are stored in your account so you can access them later, and only
              you can read them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Payment receipts</h2>
            <p className="mt-2">
              Uploaded payment screenshots are stored privately and are only accessible to you and
              to administrators verifying your payment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Data retention and deletion</h2>
            <p className="mt-2">
              You can delete any saved report at any time from your report history. To delete your
              account and all associated data, contact us through the contact page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            <p className="mt-2">
              For any privacy question, reach us through the details on our contact page.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
