import { createFileRoute } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — SIWES Writer" },
      {
        name: "description",
        content:
          "The terms that govern your use of SIWES Writer, including payment, activation, acceptable use and account rules.",
      },
      { property: "og:title", content: "Terms of Service — SIWES Writer" },
      { property: "og:description", content: "The terms governing your use of SIWES Writer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14 sm:px-6">
        <h1 className="text-4xl font-extrabold text-foreground">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">Using the service</h2>
            <p className="mt-2">
              SIWES Writer helps you rewrite your own industrial training notes into professional
              logbook entries. You are responsible for the accuracy of what you submit and for the
              final content you place in your logbook.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Accounts</h2>
            <p className="mt-2">
              You must provide accurate details when registering and keep your login credentials
              secure. Accounts found sharing access or abusing the service may be suspended.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Payment and activation</h2>
            <p className="mt-2">
              Access requires a one-time payment made by bank transfer. After you submit your
              payment details and receipt, an administrator verifies the transfer and activates your
              account. Activation is normally completed within a few hours.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Refunds</h2>
            <p className="mt-2">
              If a verified payment cannot be activated for a reason on our side, contact us and we
              will resolve it or refund the payment. Payments for accounts already activated are
              non-refundable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Acceptable use</h2>
            <p className="mt-2">
              Do not use the service to fabricate work you did not perform, to submit unlawful
              content, or to attempt to disrupt the platform. Your institution's academic rules
              still apply to your logbook.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Availability</h2>
            <p className="mt-2">
              We work to keep the service available at all times but cannot guarantee uninterrupted
              access. Features may change as the product improves.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
