import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import { getAccountOverview, updateMyProfile } from "@/lib/account.functions";
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

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — SIWES Writer" },
      { name: "description", content: "Update your name, phone number and department on SIWES Writer." },
      { property: "og:title", content: "My Profile — SIWES Writer" },
      { property: "og:description", content: "Manage your SIWES Writer profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: account, isLoading } = useQuery(accountQuery);
  const { data: site } = useQuery(siteQuery);
  const save = useServerFn(updateMyProfile);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    if (!account) return;
    setFullName(account.profile.full_name ?? "");
    setPhone(account.profile.phone ?? "");
    setDepartment(account.profile.department ?? "");
  }, [account]);

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          department: department || null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-overview"] });
      toast.success("Profile updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading || !account) {
    return (
      <DashboardShell title="Profile">
        <Skeleton className="mx-auto h-80 max-w-2xl rounded-xl" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="My profile"
      description="Keep your details up to date"
      isAdmin={account.isAdmin}
    >
      <Card className="mx-auto max-w-2xl shadow-soft">
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>
            Your department is used to pick the right wording for your reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (fullName.trim().length < 2) {
                toast.error("Enter your full name");
                return;
              }
              mutation.mutate();
            }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" value={account.profile.email ?? ""} disabled />
              <p className="text-xs text-muted-foreground">Your email can't be changed here.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                maxLength={120}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="08012345678"
                maxLength={30}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {(site?.departments ?? []).map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3.5">
              <div>
                <p className="text-sm font-medium text-foreground">Account status</p>
                <p className="text-xs text-muted-foreground">
                  {account.profile.status === "premium"
                    ? "Full access unlocked"
                    : "Awaiting payment verification"}
                </p>
              </div>
              <Badge
                variant={
                  account.profile.status === "premium"
                    ? "default"
                    : account.profile.status === "suspended"
                      ? "destructive"
                      : "secondary"
                }
              >
                {account.profile.status}
              </Badge>
            </div>

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
