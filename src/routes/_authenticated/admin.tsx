import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Banknote, FileText, Plus, Trash2, Users, Wallet } from "lucide-react";

import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getAccountOverview } from "@/lib/account.functions";
import {
  adminDeleteAnnouncement,
  adminDeleteDepartment,
  adminDeleteFaq,
  adminGetOverview,
  adminGetProofUrl,
  adminListAnnouncements,
  adminListDepartments,
  adminListFaqs,
  adminListPayments,
  adminListUsers,
  adminReviewPayment,
  adminSaveAnnouncement,
  adminSaveDepartment,
  adminSaveFaq,
  adminSetUserStatus,
  adminUpdateSettings,
} from "@/lib/admin.functions";

const accountQuery = queryOptions({
  queryKey: ["account-overview"],
  queryFn: () => getAccountOverview(),
});

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — SIWES Writer" },
      { name: "description", content: "Manage users, payments and site content for SIWES Writer." },
      { property: "og:title", content: "Admin — SIWES Writer" },
      { property: "og:description", content: "SIWES Writer administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const { data: account, isLoading } = useQuery(accountQuery);

  useEffect(() => {
    if (!isLoading && account && !account.isAdmin) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [account, isLoading, navigate]);

  if (isLoading || !account?.isAdmin) {
    return (
      <DashboardShell title="Admin">
        <Skeleton className="h-96 rounded-xl" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Admin" description="Manage the platform" isAdmin>
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentsTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="content">
          <ContentTab />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

/* ---------------- Overview ---------------- */

function OverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => adminGetOverview(),
  });

  if (isLoading || !data) return <Skeleton className="h-40 rounded-xl" />;

  const stats = [
    { label: "Total users", value: data.totalUsers.toLocaleString(), icon: Users },
    { label: "Active students", value: data.premiumUsers.toLocaleString(), icon: Wallet },
    { label: "Pending payments", value: data.pendingPayments.toLocaleString(), icon: Banknote },
    { label: "Reports generated", value: data.totalReports.toLocaleString(), icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-soft">
            <CardContent className="pt-6">
              <stat.icon className="size-5 text-primary" />
              <p className="mt-3 text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="shadow-soft">
        <CardHeader>
          <CardDescription>Total approved revenue</CardDescription>
          <CardTitle className="text-3xl">₦{data.revenue.toLocaleString()}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

/* ---------------- Payments ---------------- */

function PaymentsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: () => adminListPayments(),
  });
  const review = useServerFn(adminReviewPayment);
  const proofUrl = useServerFn(adminGetProofUrl);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (input: { paymentId: string; decision: "approved" | "rejected"; note: string | null }) =>
      review({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Payment reviewed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function openProof(path: string) {
    try {
      const { url } = await proofUrl({ data: { path } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (!data?.length) {
    return (
      <Card className="shadow-soft">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No payment submissions yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((payment) => (
        <Card key={payment.id} className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{payment.full_name}</p>
                <p className="text-sm text-muted-foreground">{payment.email}</p>
                <p className="text-sm text-muted-foreground">{payment.phone}</p>
              </div>
              <Badge
                variant={
                  payment.status === "approved"
                    ? "default"
                    : payment.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
              >
                {payment.status}
              </Badge>
            </div>

            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="font-medium text-foreground">₦{Number(payment.amount).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Reference</dt>
                <dd className="font-medium text-foreground">{payment.transaction_ref}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Payment date</dt>
                <dd className="font-medium text-foreground">{payment.payment_date}</dd>
              </div>
            </dl>

            {payment.screenshot_path && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => openProof(payment.screenshot_path as string)}
              >
                View receipt
              </Button>
            )}

            {payment.status === "pending" && (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <Input
                  value={notes[payment.id] ?? ""}
                  onChange={(event) => setNotes((prev) => ({ ...prev, [payment.id]: event.target.value }))}
                  placeholder="Optional note to the student"
                  maxLength={500}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={mutation.isPending}
                    onClick={() =>
                      mutation.mutate({
                        paymentId: payment.id,
                        decision: "approved",
                        note: notes[payment.id]?.trim() || null,
                      })
                    }
                  >
                    Approve & activate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={mutation.isPending}
                    onClick={() =>
                      mutation.mutate({
                        paymentId: payment.id,
                        decision: "rejected",
                        note: notes[payment.id]?.trim() || null,
                      })
                    }
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {payment.admin_note && payment.status !== "pending" && (
              <p className="mt-3 text-sm text-muted-foreground">Note: {payment.admin_note}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Users ---------------- */

function UsersTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminListUsers(),
  });
  const setStatus = useServerFn(adminSetUserStatus);
  const [search, setSearch] = useState("");

  const mutation = useMutation({
    mutationFn: (input: { userId: string; status: "pending" | "premium" | "suspended" }) =>
      setStatus({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  const term = search.trim().toLowerCase();
  const rows = (data ?? []).filter(
    (user) =>
      !term ||
      (user.full_name ?? "").toLowerCase().includes(term) ||
      (user.email ?? "").toLowerCase().includes(term),
  );

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg">Users</CardTitle>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email"
          className="mt-2 max-w-sm"
          maxLength={120}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell className="text-muted-foreground">{user.department ?? "—"}</TableCell>
                <TableCell>
                  <Select
                    value={user.status}
                    onValueChange={(value) =>
                      mutation.mutate({
                        userId: user.id,
                        status: value as "pending" | "premium" | "suspended",
                      })
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ---------------- Content ---------------- */

function ContentTab() {
  return (
    <div className="space-y-6">
      <FaqSection />
      <AnnouncementSection />
      <DepartmentSection />
    </div>
  );
}

function FaqSection() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-faqs"], queryFn: () => adminListFaqs() });
  const save = useServerFn(adminSaveFaq);
  const remove = useServerFn(adminDeleteFaq);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
    queryClient.invalidateQueries({ queryKey: ["public-site-data"] });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: null,
          question: question.trim(),
          answer: answer.trim(),
          sort_order: (data?.length ?? 0) + 1,
        },
      }),
    onSuccess: () => {
      setQuestion("");
      setAnswer("");
      invalidate();
      toast.success("FAQ added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("FAQ removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg">FAQs</CardTitle>
        <CardDescription>Shown on the landing page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(data ?? []).map((faq) => (
          <div key={faq.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">{faq.question}</p>
              <p className="mt-1 text-sm text-muted-foreground">{faq.answer}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive"
              onClick={() => deleteMutation.mutate(faq.id)}
              aria-label="Delete FAQ"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}

        <form
          className="space-y-3 border-t border-border pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="faq-question">Question</Label>
            <Input
              id="faq-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={300}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faq-answer">Answer</Label>
            <Textarea
              id="faq-answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              maxLength={2000}
              rows={3}
              required
            />
          </div>
          <Button type="submit" size="sm" className="gap-1.5" disabled={saveMutation.isPending}>
            <Plus className="size-4" /> Add FAQ
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AnnouncementSection() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: () => adminListAnnouncements(),
  });
  const save = useServerFn(adminSaveAnnouncement);
  const remove = useServerFn(adminDeleteAnnouncement);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    queryClient.invalidateQueries({ queryKey: ["account-overview"] });
  };

  const saveMutation = useMutation({
    mutationFn: (input: { id: string | null; title: string; body: string; is_active: boolean }) =>
      save({ data: input }),
    onSuccess: () => {
      setTitle("");
      setBody("");
      invalidate();
      toast.success("Announcement saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Announcement removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg">Announcements</CardTitle>
        <CardDescription>Active announcements appear on student dashboards.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(data ?? []).map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={item.is_active}
                onCheckedChange={(checked) =>
                  saveMutation.mutate({
                    id: item.id,
                    title: item.title,
                    body: item.body,
                    is_active: checked,
                  })
                }
                aria-label="Toggle announcement"
              />
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                onClick={() => deleteMutation.mutate(item.id)}
                aria-label="Delete announcement"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}

        <form
          className="space-y-3 border-t border-border pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate({
              id: null,
              title: title.trim(),
              body: body.trim(),
              is_active: true,
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="ann-title">Title</Label>
            <Input
              id="ann-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ann-body">Message</Label>
            <Textarea
              id="ann-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={2000}
              rows={3}
              required
            />
          </div>
          <Button type="submit" size="sm" className="gap-1.5" disabled={saveMutation.isPending}>
            <Plus className="size-4" /> Publish announcement
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DepartmentSection() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-departments"],
    queryFn: () => adminListDepartments(),
  });
  const save = useServerFn(adminSaveDepartment);
  const remove = useServerFn(adminDeleteDepartment);
  const [name, setName] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-departments"] });
    queryClient.invalidateQueries({ queryKey: ["public-site-data"] });
  };

  const saveMutation = useMutation({
    mutationFn: (input: { id: string | null; name: string; is_active: boolean }) => save({ data: input }),
    onSuccess: () => {
      setName("");
      invalidate();
      toast.success("Department saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Department removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg">Departments</CardTitle>
        <CardDescription>Options students choose from when generating reports.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {(data ?? []).map((dept) => (
            <div
              key={dept.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-2.5"
            >
              <span className="text-sm text-foreground">{dept.name}</span>
              <div className="flex items-center gap-2">
                <Switch
                  checked={dept.is_active}
                  onCheckedChange={(checked) =>
                    saveMutation.mutate({ id: dept.id, name: dept.name, is_active: checked })
                  }
                  aria-label="Toggle department"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => deleteMutation.mutate(dept.id)}
                  aria-label="Delete department"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <form
          className="flex gap-2 border-t border-border pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate({ id: null, name: name.trim(), is_active: true });
          }}
        >
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="New department name"
            maxLength={120}
            required
          />
          <Button type="submit" size="sm" disabled={saveMutation.isPending}>
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ---------------- Settings ---------------- */

const SETTING_FIELDS = [
  { key: "price_naira", label: "Price (₦)" },
  { key: "bank_name", label: "Bank name" },
  { key: "account_number", label: "Account number" },
  { key: "account_name", label: "Account name" },
  { key: "support_email", label: "Support email" },
  { key: "support_phone", label: "Support phone / WhatsApp" },
];

function SettingsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => adminGetOverview(),
  });
  const update = useServerFn(adminUpdateSettings);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data?.settings) setValues(data.settings);
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => update({ data: { entries: values } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      queryClient.invalidateQueries({ queryKey: ["public-site-data"] });
      toast.success("Settings saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) return <Skeleton className="h-72 rounded-xl" />;

  return (
    <Card className="mx-auto max-w-2xl shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg">Payment & contact settings</CardTitle>
        <CardDescription>These values show on the pricing and payment pages.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          {SETTING_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                value={values[field.key] ?? ""}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, [field.key]: event.target.value }))
                }
                maxLength={2000}
              />
            </div>
          ))}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
