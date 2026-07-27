import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, FileText, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getAccountOverview } from "@/lib/account.functions";
import { deleteReport, listMyReports } from "@/lib/reports.functions";

const accountQuery = queryOptions({
  queryKey: ["account-overview"],
  queryFn: () => getAccountOverview(),
});

const reportsQuery = queryOptions({
  queryKey: ["my-reports"],
  queryFn: () => listMyReports(),
});

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "My Reports — SIWES Writer" },
      { name: "description", content: "Every SIWES report you've generated, saved in one place." },
      { property: "og:title", content: "My Reports — SIWES Writer" },
      { property: "og:description", content: "Your saved SIWES report history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportsPage,
});

const TYPE_LABEL = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" } as const;

function ReportsPage() {
  const queryClient = useQueryClient();
  const { data: account } = useQuery(accountQuery);
  const { data: reports, isLoading } = useQuery(reportsQuery);
  const remove = useServerFn(deleteReport);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "daily" | "weekly" | "monthly">("all");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reports"] });
      queryClient.invalidateQueries({ queryKey: ["account-overview"] });
      toast.success("Report deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (reports ?? []).filter((report) => {
      if (typeFilter !== "all" && report.report_type !== typeFilter) return false;
      if (!term) return true;
      return (
        report.ai_output.toLowerCase().includes(term) ||
        report.original_text.toLowerCase().includes(term) ||
        report.department.toLowerCase().includes(term)
      );
    });
  }, [reports, search, typeFilter]);

  async function copy(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <DashboardShell
      title="My reports"
      description={`${reports?.length ?? 0} saved report${reports?.length === 1 ? "" : "s"}`}
      isAdmin={account?.isAdmin}
    >
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your reports…"
              className="pl-9"
              maxLength={120}
            />
          </div>
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="flex flex-col items-center py-14 text-center">
              <FileText className="size-10 text-muted-foreground/50" />
              <h2 className="mt-4 font-semibold text-foreground">
                {reports?.length ? "No reports match your filters" : "No reports yet"}
              </h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {reports?.length
                  ? "Try a different search term or report type."
                  : "Generate your first report and it will be saved here automatically."}
              </p>
              {!reports?.length && (
                <Button asChild className="mt-5">
                  <Link to="/generate">Generate a report</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filtered.map((report) => (
            <Card key={report.id} className="shadow-soft">
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{TYPE_LABEL[report.report_type]}</Badge>
                  <span className="text-xs text-muted-foreground">{report.department}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-foreground">{report.ai_output}</p>

                <details className="mt-3 text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    View original notes
                  </summary>
                  <p className="mt-2 rounded-md bg-secondary/60 p-3 text-muted-foreground">
                    {report.original_text}
                  </p>
                </details>

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => copy(report.id, report.ai_output)}
                  >
                    {copiedId === report.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copiedId === report.id ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => setPendingDelete(report.id)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the report from your history. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteMutation.mutate(pendingDelete);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
