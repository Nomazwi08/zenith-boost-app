import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { streamText, type ModelMessage } from "ai";
import { getAiGateway, DEFAULT_MODEL } from "@/lib/ai-gateway.server";
import { CHAT_SYSTEM } from "@/lib/prompts";
import type { Database } from "@/integrations/supabase/types";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatBody {
  threadId: string;
  messages: ChatMessage[];
}

function isNewSupabaseApiKey(v: string) {
  return v.startsWith("sb_publishable_") || v.startsWith("sb_secret_");
}

function makeUserClient(token: string) {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (isNewSupabaseApiKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice(7);
        const body = (await request.json()) as ChatBody;
        if (!body?.threadId || !Array.isArray(body.messages)) {
          return new Response("Bad request", { status: 400 });
        }

        const supabase = makeUserClient(token);
        const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
        if (claimsErr || !claims?.claims?.sub) {
          return new Response("Unauthorized", { status: 401 });
        }
        const userId = claims.claims.sub as string;

        const lastUser = [...body.messages].reverse().find((m) => m.role === "user");

        // Persist the newly-sent user message (last one only).
        if (lastUser) {
          await supabase.from("chat_messages").insert({
            thread_id: body.threadId,
            user_id: userId,
            role: "user",
            parts: [{ type: "text", text: lastUser.content }],
          });
          // Auto-title on the first exchange.
          const { count } = await supabase
            .from("chat_messages")
            .select("id", { count: "exact", head: true })
            .eq("thread_id", body.threadId);
          if (count === 1) {
            const title = lastUser.content.slice(0, 60).replace(/\s+/g, " ").trim();
            if (title) {
              await supabase
                .from("chat_threads")
                .update({ title })
                .eq("id", body.threadId);
            }
          }
        }

        const gateway = getAiGateway();
        const modelMessages: ModelMessage[] = body.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const result = streamText({
          model: gateway(DEFAULT_MODEL),
          system: CHAT_SYSTEM,
          messages: modelMessages,
          onFinish: async ({ text }) => {
            await supabase.from("chat_messages").insert({
              thread_id: body.threadId,
              user_id: userId,
              role: "assistant",
              parts: [{ type: "text", text }],
            });
            await supabase
              .from("chat_threads")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", body.threadId);
          },
        });

        return result.toTextStreamResponse();
      },
    },
  },
});
