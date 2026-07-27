import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock, FileText, Sparkles, Wallet } from "lucide-react";

import { DashboardShell } from "@/components/dashboard-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAccountOverview } from "@/lib/account.functions";
import { getPublicSiteData } from "@/lib/public.functions";

export const accountQuery = queryOptions({
  queryKey: ["account-overview"],
  queryFn: () => getAccountOverview(),
});

const siteQuery = queryOptions({
  queryKey: ["public-site-data"],
  queryFn: () => getPublicSiteData(),
  staleTime: 5 * 60 * 1000,
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SIWES Writer" },
      { name: "description", content: "Your SIWES Writer dashboard: account status, reports and quick actions." },
      { property: "og:title", content: "Dashboard — SIWES Writer" },
      { property: "og:description", content: "Your SIWES Writer dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading } = useQuery(accountQuery);
  const { data: site } = useQuery(siteQuery);

  if (isLoading || !data) {
    return (
      <DashboardShell title="Dashboard">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  const isPremium = data.profile.status === "premium";
  const isSuspended = data.profile.status === "suspended";
  const firstName = data.profile.full_name?.split(" ")[0] ?? "there";
  const announcements = site?.announcements ?? [];

  return (
    <DashboardShell
      title={`Welcome back, ${firstName}`}
      description="Here's where your SIWES reports live"
      isAdmin={data.isAdmin}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {announcements.map((item) => (
          <Alert key={item.id}>
            <Sparkles className="size-4" />
            <AlertTitle>{item.title}</AlertTitle>
            <AlertDescription>{item.body}</AlertDescription>
          </Alert>
        ))}

        {isSuspended && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Account suspended</AlertTitle>
            <AlertDescription>
              Your account has been suspended. Please contact support to resolve this.
            </AlertDescription>
          </Alert>
        )}

        {!isPremium && !isSuspended && (
          <Card className="border-warning/40 bg-warning/5">
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
                  <Clock className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-lg">
                    {data.latestPayment?.status === "pending"
                      ? "Payment under review"
                      : data.latestPayment?.status === "rejected"
                        ? "Payment was not approved"
                        : "Activate your account"}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {data.latestPayment?.status === "pending"
                      ? "We've received your payment details and are verifying them. You'll get access as soon as it's approved."
                      : data.latestPayment?.status === "rejected"
                        ? data.latestPayment.admin_note ||
                          "Your payment couldn't be verified. Please submit your details again."
                        : "Make a one-time payment and upload your receipt to unlock unlimited report generation."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            {data.latestPayment?.status !== "pending" && (
              <CardContent>
                <Button asChild>
                  <Link to="/upgrade">
                    <Wallet className="size-4" />
                    {data.latestPayment?.status === "rejected" ? "Resubmit payment" : "Make payment"}
                  </Link>
                </Button>
              </CardContent>
            )}
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Account status
              </p>
              <div className="mt-2">
                <Badge
                  variant={isPremium ? "default" : isSuspended ? "destructive" : "secondary"}
                  className="gap-1"
                >
                  {isPremium && <CheckCircle2 className="size-3" />}
                  {isPremium ? "Active" : isSuspended ? "Suspended" : "Pending"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Reports generated
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">{data.reportCount}</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Department
              </p>
              <p className="mt-2 truncate text-sm font-semibold text-foreground">
                {data.profile.department ?? "Not set"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className={isPremium ? "border-primary/40 shadow-lift" : "shadow-soft"}>
            <CardHeader>
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Sparkles className="size-5" />
              </span>
              <CardTitle className="mt-3 text-lg">Generate a report</CardTitle>
              <CardDescription>
                Turn today's rough notes into a clean logbook entry.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild disabled={!isPremium} className="w-full">
                <Link to={isPremium ? "/generate" : "/upgrade"}>
                  {isPremium ? "Start writing" : "Activate to unlock"}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground">
                <FileText className="size-5" />
              </span>
              <CardTitle className="mt-3 text-lg">Report history</CardTitle>
              <CardDescription>Revisit, copy or delete reports you've saved.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/reports">View my reports</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
