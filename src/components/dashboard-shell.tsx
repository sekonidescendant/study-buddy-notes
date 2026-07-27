import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/generate", label: "Generate report", icon: Sparkles },
  { to: "/reports", label: "My reports", icon: History },
  { to: "/upgrade", label: "Payment", icon: Wallet },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export function DashboardShell({
  title,
  description,
  isAdmin = false,
  children,
}: {
  title: string;
  description?: string;
  isAdmin?: boolean;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "login", redirect: undefined }, replace: true });
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          onClick={() => setOpen(false)}
          activeProps={{ className: "bg-primary-soft text-primary font-semibold" }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <link.icon className="size-4" />
          {link.label}
        </Link>
      ))}
      {isAdmin && (
        <Link
          to="/admin"
          onClick={() => setOpen(false)}
          activeProps={{ className: "bg-primary-soft text-primary font-semibold" }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Shield className="size-4" />
          Admin
        </Link>
      )}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-background p-4 lg:flex">
        <Logo className="px-2 py-2" />
        <div className="mt-6 flex-1">{nav}</div>
        <Button variant="ghost" className="justify-start gap-3 text-muted-foreground" onClick={signOut}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-lg sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Logo className="px-2 py-2" />
              <div className="mt-6">{nav}</div>
              <Button
                variant="ghost"
                className="mt-4 w-full justify-start gap-3 text-muted-foreground"
                onClick={signOut}
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">{title}</h1>
            {description && (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            )}
          </div>

          <Button asChild size="sm" className="gap-1.5">
            <Link to="/generate">
              <FileText className="size-4" />
              <span className="hidden sm:inline">New report</span>
            </Link>
          </Button>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
