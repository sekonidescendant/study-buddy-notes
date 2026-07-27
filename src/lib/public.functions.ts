import { createServerFn } from "@tanstack/react-start";

import { createPublicSupabaseClient } from "./supabase-public.server";

export type PublicSiteData = {
  settings: Record<string, string>;
  faqs: { id: string; question: string; answer: string }[];
  departments: string[];
  announcements: { id: string; title: string; body: string }[];
};

export const getPublicSiteData = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicSiteData> => {
    const supabase = createPublicSupabaseClient();

    const [settingsRes, faqsRes, deptRes, annRes] = await Promise.all([
      supabase.from("settings").select("key, value"),
      supabase.from("faqs").select("id, question, answer").order("sort_order"),
      supabase.from("departments").select("name").eq("is_active", true).order("sort_order"),
      supabase.from("announcements").select("id, title, body").eq("is_active", true),
    ]);

    const settings: Record<string, string> = {};
    for (const row of settingsRes.data ?? []) settings[row.key] = row.value;

    return {
      settings,
      faqs: faqsRes.data ?? [],
      departments: (deptRes.data ?? []).map((d) => d.name),
      announcements: annRes.data ?? [],
    };
  },
);
