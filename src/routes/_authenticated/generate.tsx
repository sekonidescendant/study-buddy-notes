import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Download, Lock, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getAccountOverview } from "@/lib/account.functions";
import { getPublicSiteData } from "@/lib/public.functions";
import { generateReport } from "@/lib/reports.functions";

const accountQuery = queryOptions({
  queryKey: ["account-overview"],
  queryFn: () => getAccountOverview(),
});

const siteQuery = queryOptions({
  queryKey: ["public-site-data"],
  queryFn: () => getPublicSiteData(),
  staleTime: 5 * 60 * 1000,
});

const REPORT_TYPES = [
  { value: "daily", label: "Daily report", hint: "One day's activities, 25–50 words" },
  { value: "weekly", label: "Weekly summary", hint: "A full week rolled into one entry" },
  { value: "monthly", label: "Monthly summary", hint: "A month of work, summarised" },
] as const;

export const Route = createFileRoute("/_authenticated/generate")({
  head: () => ({
    meta: [
      { title: "Generate Report — SIWES Writer" },
      { name: "description", content: "Turn your rough SIWES notes into a professional logbook entry." },
      { property: "og:title", content: "Generate Report — SIWES Writer" },
      { property: "og:description", content: "Turn rough notes into a professional logbook entry." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GeneratePage,
});

function GeneratePage() {
  const queryClient = useQueryClient();
  const { data: account, isLoading } = useQuery(accountQuery);
  const { data: site } = useQuery(siteQuery);
  const generate = useServerFn(generateReport);

  const [department, setDepartment] = useState("");
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [notes, setNotes] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const effectiveDepartment = department || account?.profile.department || "";
  const departments = site?.departments ?? [];

  const mutation = useMutation({
    mutationFn: (vars: { department: string; reportType: typeof reportType; notes: string }) =>
      generate({ data: vars }),
    onSuccess: (result) => {
      setOutput(result.output);
      queryClient.invalidateQueries({ queryKey: ["my-reports"] });
      queryClient.invalidateQueries({ queryKey: ["account-overview"] });
      toast.success(result.saved ? "Report ready and saved" : "Report ready");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading || !account) {
    return (
      <DashboardShell title="Generate report">
        <Skeleton className="mx-auto h-96 max-w-3xl rounded-xl" />
      </DashboardShell>
    );
  }

  if (account.profile.status !== "premium") {
    return (
      <DashboardShell title="Generate report" isAdmin={account.isAdmin}>
        <Card className="mx-auto max-w-lg text-center shadow-soft">
          <CardHeader>
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-warning/15 text-warning">
              <Lock className="size-6" />
            </span>
            <CardTitle className="mt-3">Activate your account first</CardTitle>
            <CardDescription>
              Report generation unlocks once your one-time payment is verified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/upgrade">Go to payment</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `siwes-${reportType}-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!effectiveDepartment) {
      toast.error("Please select your department");
      return;
    }
    if (notes.trim().length < 10) {
      toast.error("Add a bit more detail about what you did");
      return;
    }
    mutation.mutate({ department: effectiveDepartment, reportType, notes: notes.trim() });
  }

  return (
    <DashboardShell
      title="Generate report"
      description="Describe what you did — we'll handle the wording"
      isAdmin={account.isAdmin}
    >
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Your rough notes</CardTitle>
            <CardDescription>Bullet points and broken English are fine.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={effectiveDepartment} onValueChange={setDepartment}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {departments.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportType">Report type</Label>
                <Select
                  value={reportType}
                  onValueChange={(value) => setReportType(value as typeof reportType)}
                >
                  <SelectTrigger id="reportType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {REPORT_TYPES.find((type) => type.value === reportType)?.hint}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">What did you do?</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={9}
                  maxLength={4000}
                  placeholder="e.g. today i help the technician service the generator, we change oil and filter then start am to test"
                  className="resize-none"
                />
                <p className="text-right text-xs text-muted-foreground">{notes.length}/4000</p>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    Writing your report…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate report
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className={output ? "border-primary/40 shadow-lift" : "shadow-soft"}>
          <CardHeader>
            <CardTitle className="text-lg">Your polished report</CardTitle>
            <CardDescription>Copy this straight into your logbook.</CardDescription>
          </CardHeader>
          <CardContent>
            {mutation.isPending ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-10/12" />
                <Skeleton className="h-4 w-8/12" />
              </div>
            ) : output ? (
              <>
                <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm leading-relaxed text-foreground">
                  {output}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {output.trim().split(/\s+/).length} words
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={handleCopy} className="gap-2">
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="outline" onClick={handleDownload} className="gap-2">
                    <Download className="size-4" />
                    Download
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link to="/reports">View history</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
                <Sparkles className="size-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Your finished report will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
