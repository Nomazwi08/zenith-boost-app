import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { getAiGateway, DEFAULT_MODEL } from "./ai-gateway.server";
import { buildTaskPlanPrompt, type TaskPlanInput } from "./prompts";

export const listPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("task_plans")
      .select("id, goal, priority, deadline, updated_at, created_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const getPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("task_plans")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: TaskPlanInput) => input)
  .handler(async ({ data, context }) => {
    const { system, user } = buildTaskPlanPrompt(data);
    const gateway = getAiGateway();
    const { text } = await generateText({
      model: gateway(DEFAULT_MODEL),
      system,
      prompt: user,
    });
    const { data: inserted, error } = await context.supabase
      .from("task_plans")
      .insert({
        user_id: context.userId,
        goal: data.goal,
        priority: data.priority,
        deadline: data.deadline || null,
        hours: data.hours ?? null,
        description: data.description || null,
        content: text,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const updatePlanContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; content: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("task_plans")
      .update({ content: data.content })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("task_plans").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
