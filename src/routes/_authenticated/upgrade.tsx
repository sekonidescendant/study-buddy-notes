import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, CheckCircle2, Clock, Copy, Upload, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { getAccountOverview, listMyPayments, submitPayment } from "@/lib/account.functions";
import { getPublicSiteData } from "@/lib/public.functions";

const accountQuery = queryOptions({
  queryKey: ["account-overview"],
  queryFn: () => getAccountOverview(),
});

const siteQuery = queryOptions({
  queryKey: ["public-site-data"],
  queryFn: () => getPublicSiteData(),
  staleTime: 5 * 60 * 1000,
});

const paymentsQuery = queryOptions({
  queryKey: ["my-payments"],
  queryFn: () => listMyPayments(),
});

export const Route = createFileRoute("/_authenticated/upgrade")({
  head: () => ({
    meta: [
      { title: "Activate Your Account — SIWES Writer" },
      { name: "description", content: "Make your one-time payment and upload your receipt to unlock SIWES Writer." },
      { property: "og:title", content: "Activate Your Account — SIWES Writer" },
      { property: "og:description", content: "Unlock unlimited SIWES report generation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UpgradePage,
});

const STATUS_META = {
  pending: { label: "Under review", icon: Clock, variant: "secondary" as const },
  approved: { label: "Approved", icon: CheckCircle2, variant: "default" as const },
  rejected: { label: "Rejected", icon: XCircle, variant: "destructive" as const },
};

function UpgradePage() {
  const queryClient = useQueryClient();
  const { data: account, isLoading } = useQuery(accountQuery);
  const { data: site } = useQuery(siteQuery);
  const { data: payments } = useQuery(paymentsQuery);
  const submit = useServerFn(submitPayment);

  const [transactionRef, setTransactionRef] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const settings = site?.settings ?? {};
  const price = Number(settings.price_naira ?? 2000);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Account not loaded");

      let screenshotPath: string | null = null;
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error("Receipt must be smaller than 5MB");
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
        const path = `${account.profile.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("payment-proofs").upload(path, file);
        if (error) throw new Error(error.message);
        screenshotPath = path;
      }

      return submit({
        data: {
          full_name: account.profile.full_name ?? "Student",
          email: account.profile.email ?? "",
          phone: phone.trim(),
          amount: price,
          payment_date: paymentDate,
          transaction_ref: transactionRef.trim(),
          screenshot_path: screenshotPath,
        },
      });
    },
    onSuccess: () => {
      toast.success("Payment submitted. We'll verify it shortly.");
      setTransactionRef("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["my-payments"] });
      queryClient.invalidateQueries({ queryKey: ["account-overview"] });
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setUploading(false),
  });

  if (isLoading || !account) {
    return (
      <DashboardShell title="Payment">
        <Skeleton className="mx-auto h-96 max-w-3xl rounded-xl" />
      </DashboardShell>
    );
  }

  const isPremium = account.profile.status === "premium";
  const hasPending = payments?.some((payment) => payment.status === "pending");

  async function copyText(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  }

  return (
    <DashboardShell
      title="Payment & activation"
      description="One-time payment for lifetime access"
      isAdmin={account.isAdmin}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {isPremium && (
          <Alert>
            <CheckCircle2 className="size-4" />
            <AlertTitle>Your account is active</AlertTitle>
            <AlertDescription>
              You have full access to unlimited report generation. Thank you!
            </AlertDescription>
          </Alert>
        )}

        {!isPremium && (
          <>
            <Card className="border-primary/40 shadow-lift">
              <CardHeader>
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Building2 className="size-5" />
                </span>
                <CardTitle className="mt-3">Step 1 — Transfer ₦{price.toLocaleString()}</CardTitle>
                <CardDescription>
                  Send the exact amount to the account below, then fill the form underneath.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-border rounded-lg border border-border">
                  {[
                    { label: "Bank", value: settings.bank_name ?? "Not configured" },
                    { label: "Account number", value: settings.account_number ?? "Not configured" },
                    { label: "Account name", value: settings.account_name ?? "Not configured" },
                    { label: "Amount", value: `₦${price.toLocaleString()}` },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3 p-3.5">
                      <dt className="text-sm text-muted-foreground">{row.label}</dt>
                      <dd className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        {row.value}
                        <button
                          type="button"
                          onClick={() => copyText(row.value, row.label)}
                          className="text-muted-foreground transition-colors hover:text-primary"
                          aria-label={`Copy ${row.label}`}
                        >
                          <Copy className="size-3.5" />
                        </button>
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Step 2 — Submit your payment details</CardTitle>
                <CardDescription>
                  We verify manually, usually within a few hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasPending ? (
                  <Alert>
                    <Clock className="size-4" />
                    <AlertTitle>Payment already submitted</AlertTitle>
                    <AlertDescription>
                      We're reviewing your last submission. You'll be activated once it's approved.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (transactionRef.trim().length < 3) {
                        toast.error("Enter the transaction reference from your bank");
                        return;
                      }
                      if (phone.trim().length < 6) {
                        toast.error("Enter the phone number you can be reached on");
                        return;
                      }
                      setUploading(true);
                      mutation.mutate();
                    }}
                    className="space-y-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="transactionRef">Transaction reference</Label>
                        <Input
                          id="transactionRef"
                          value={transactionRef}
                          onChange={(event) => setTransactionRef(event.target.value)}
                          placeholder="e.g. TRF/2024/889201"
                          maxLength={120}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentDate">Payment date</Label>
                        <Input
                          id="paymentDate"
                          type="date"
                          value={paymentDate}
                          onChange={(event) => setPaymentDate(event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="08012345678"
                        maxLength={30}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="receipt">Payment receipt (optional but faster)</Label>
                      <label
                        htmlFor="receipt"
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-4 transition-colors hover:border-primary/50"
                      >
                        <Upload className="size-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {file ? file.name : "Upload a screenshot of your transfer (max 5MB)"}
                        </span>
                      </label>
                      <input
                        id="receipt"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={uploading || mutation.isPending}>
                      {uploading || mutation.isPending ? "Submitting…" : "Submit for verification"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {payments && payments.length > 0 && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Payment history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payments.map((payment) => {
                const meta = STATUS_META[payment.status];
                return (
                  <div
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        ₦{Number(payment.amount).toLocaleString()} · {payment.transaction_ref}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      {payment.admin_note && (
                        <p className="mt-1 text-xs text-muted-foreground">{payment.admin_note}</p>
                      )}
                    </div>
                    <Badge variant={meta.variant} className="gap-1">
                      <meta.icon className="size-3" />
                      {meta.label}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
