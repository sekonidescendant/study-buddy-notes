import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { AiServiceError, generateSiwesReport } from "./ai-service.server";

const GenerateInput = z.object({
  department: z.string().trim().min(1, "Select your department").max(120),
  reportType: z.enum(["daily", "weekly", "monthly"]),
  notes: z.string().trim().min(10, "Add a little more detail").max(4000),
});

export const generateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.status !== "premium") {
      throw new Error("Your account is not activated yet. Complete payment to start generating.");
    }

    let output: string;
    try {
      output = await generateSiwesReport(data);
    } catch (error) {
      if (error instanceof AiServiceError) throw new Error(error.message);
      throw error;
    }

    const { data: saved, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        department: data.department,
        report_type: data.reportType,
        original_text: data.notes,
        ai_output: output,
      })
      .select("id, ai_output, created_at")
      .single();

    if (error) {
      console.error("[reports] save failed:", error.message);
      return { id: null as string | null, output, saved: false };
    }

    return { id: saved.id, output: saved.ai_output, saved: true };
  });

export const listMyReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("reports")
      .select("id, department, report_type, original_text, ai_output, created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("reports").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
