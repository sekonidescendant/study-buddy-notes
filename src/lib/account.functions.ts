import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AccountOverview = {
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    department: string | null;
    status: "pending" | "premium" | "suspended";
  };
  isAdmin: boolean;
  reportCount: number;
  latestPayment: {
    id: string;
    status: "pending" | "approved" | "rejected";
    transaction_ref: string;
    admin_note: string | null;
    created_at: string;
  } | null;
};

export const getAccountOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccountOverview> => {
    const { supabase, userId } = context;

    const [profileRes, roleRes, countRes, paymentRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, phone, department, status")
        .eq("id", userId)
        .maybeSingle(),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
      supabase.from("reports").select("id", { count: "exact", head: true }),
      supabase
        .from("payments")
        .select("id, status, transaction_ref, admin_note, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      profile:
        profileRes.data ?? {
          id: userId,
          full_name: null,
          email: null,
          phone: null,
          department: null,
          status: "pending" as const,
        },
      isAdmin: roleRes.data === true,
      reportCount: countRes.count ?? 0,
      latestPayment: paymentRes.data ?? null,
    };
  });

const ProfileInput = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).nullable(),
  department: z.string().trim().max(120).nullable(),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone: data.phone || null,
        department: data.department || null,
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const PaymentInput = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().min(6).max(30),
  amount: z.number().positive().max(10_000_000),
  payment_date: z.string().min(4).max(30),
  transaction_ref: z.string().trim().min(3).max(120),
  screenshot_path: z.string().trim().max(400).nullable(),
});

export const submitPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PaymentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("payments").insert({
      ...data,
      user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payments")
      .select("id, amount, payment_date, transaction_ref, status, admin_note, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
