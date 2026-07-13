import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { getAiGateway, DEFAULT_MODEL } from "./ai-gateway.server";
import { buildResearchPrompt, type ResearchInput } from "./prompts";

export const listReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("research_reports")
      .select("id, topic, depth, updated_at, created_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const getReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("research_reports")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const generateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ResearchInput) => input)
  .handler(async ({ data, context }) => {
    const { system, user } = buildResearchPrompt(data);
    const gateway = getAiGateway();
    const { text } = await generateText({
      model: gateway(DEFAULT_MODEL),
      system,
      prompt: user,
    });
    const { data: inserted, error } = await context.supabase
      .from("research_reports")
      .insert({
        user_id: context.userId,
        topic: data.topic,
        objective: data.objective || null,
        audience: data.audience || null,
        depth: data.depth,
        content: text,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const updateReportContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; content: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("research_reports")
      .update({ content: data.content })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("research_reports").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
