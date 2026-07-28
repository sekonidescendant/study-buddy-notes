import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Download, Lock, RefreshCw, Sparkles } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Camera, X } from "lucide-react";

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

function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read the image"));
      img.onload = () => {
        const MAX_DIMENSION = 1600;
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const scale = MAX_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process the image"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveDepartment = department || account?.profile.department || "";
  const departments = site?.departments ?? [];

  const mutation = useMutation({
    mutationFn: (vars: {
      department: string;
      reportType: typeof reportType;
      notes?: string;
      imageBase64?: string;
      imageMimeType?: string;
    }) => generate({ data: vars }),
    onSuccess: (result) => {
      setOutput(result.output);
      queryClient.invalidateQueries({ queryKey: ["my-reports"] });
      queryClient.invalidateQueries({ queryKey: ["account-overview"] });
      toast.success(result.saved ? "Report ready and saved" : "Report ready");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setImageData(compressed);
      setImagePreview(`data:${compressed.mimeType};base64,${compressed.base64}`);
    } catch {
      toast.error("Couldn't process that photo, please try another one");
    }
    setCompressing(false);
  }

  function clearImage() {
    setImageData(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
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
    if (notes.trim().length < 10 && !imageData) {
      toast.error("Add a bit more detail, or upload a photo of your notes");
      return;
    }
    mutation.mutate({
      department: effectiveDepartment,
      reportType,
      notes: notes.trim() || undefined,
      imageBase64: imageData?.base64,
      imageMimeType: imageData?.mimeType,
    });
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
                  rows={7}
                  maxLength={4000}
                  placeholder="e.g. today i help the technician service the generator, we change oil and filter then start am to test"
                  className="resize-none"
                />
                <p className="text-right text-xs text-muted-foreground">{notes.length}/4000</p>
              </div>

              <div className="space-y-2">
                <Label>Or upload a photo of your notes</Label>
                {imagePreview ? (
                  <div className="relative overflow-hidden rounded-lg border border-border">
                    <img src={imagePreview} alt="Your uploaded notes" className="max-h-56 w-full object-contain bg-secondary/30" />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 shadow-sm hover:bg-background"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={compressing}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  >
                    <Camera className="size-6" />
                    {compressing ? "Processing photo…" : "Tap to snap or choose a photo"}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  Handwritten or typed, doesn't matter, we'll read it directly from the photo.
                </p>
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
