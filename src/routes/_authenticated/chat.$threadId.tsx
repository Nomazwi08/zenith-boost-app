import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  createThread,
  deleteThread,
  getThreadMessages,
  listThreads,
} from "@/lib/threads.functions";
import { MarkdownView } from "@/components/markdown-view";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { toast } from "sonner";
import {
  Copy,
  MessageSquarePlus,
  Send,
  Square,
  Trash2,
  Sparkles,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  head: () => ({ meta: [{ title: "Chat — Aivora" }] }),
  component: ChatThread,
});

interface UIMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Help me prioritize today's work.",
  "Summarize this report: [paste]",
  "Brainstorm project ideas for a fintech launch.",
  "Explain vector embeddings simply.",
  "Create a 30-min meeting agenda for a product sync.",
  "Improve this email: [paste]",
];

function extractText(parts: unknown): string {
  if (!Array.isArray(parts)) return "";
  return parts
    .map((p) => (p && typeof p === "object" && "text" in p ? String((p as { text: string }).text) : ""))
    .join("");
}

function ChatThread() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const _list = useServerFn(listThreads);
  const _load = useServerFn(getThreadMessages);
  const _create = useServerFn(createThread);
  const _delete = useServerFn(deleteThread);

  const threads = useQuery({ queryKey: ["threads"], queryFn: () => _list({}) });
  const loaded = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => _load({ data: { threadId } }),
  });

  const [messages, setMessages] = useState<UIMsg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loaded.data) return;
    setMessages(
      loaded.data.messages.map((m) => ({
        id: m.id,
        role: (m.role === "user" ? "user" : "assistant") as UIMsg["role"],
        content: extractText(m.parts),
      })),
    );
  }, [loaded.data, threadId]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const createNew = useMutation({
    mutationFn: () => _create({}),
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: id } });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => _delete({ data: { id } }),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      if (id === threadId) {
        navigate({ to: "/chat" });
      }
    },
  });

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;
      const userMsg: UIMsg = { id: crypto.randomUUID(), role: "user", content: trimmed };
      const assistantId = crypto.randomUUID();
      const outgoing = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);
      setInput("");
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ threadId, messages: outgoing }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || `Request failed: ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
          );
        }
        qc.invalidateQueries({ queryKey: ["threads"] });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        toast.error(err instanceof Error ? err.message : "Chat failed");
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming, threadId, qc],
  );

  const stop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const regenerate = () => {
    const lastUserIdx = [...messages].map((m) => m.role).lastIndexOf("user");
    if (lastUserIdx < 0) return;
    const lastUser = messages[lastUserIdx];
    setMessages((prev) => prev.slice(0, lastUserIdx));
    setTimeout(() => send(lastUser.content), 0);
  };

  const activeTitle = useMemo(() => {
    return threads.data?.find((t) => t.id === threadId)?.title ?? loaded.data?.thread?.title ?? "Chat";
  }, [threads.data, loaded.data, threadId]);

  return (
    <>
      <AppTopbar title={activeTitle} subtitle="AI Chat Assistant" />
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[260px_1fr]">
        {/* Thread list */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-2">
            <Button className="w-full" onClick={() => createNew.mutate()} disabled={createNew.isPending}>
              <MessageSquarePlus className="mr-2 h-4 w-4" /> New conversation
            </Button>
            <div className="rounded-lg border border-border/60 bg-card">
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-1 p-2">
                  {(threads.data ?? []).map((t) => (
                    <div key={t.id} className="group flex items-center gap-1">
                      <Link
                        to="/chat/$threadId"
                        params={{ threadId: t.id }}
                        className={cn(
                          "min-w-0 flex-1 truncate rounded-md px-2 py-2 text-sm hover:bg-muted",
                          t.id === threadId && "bg-muted font-medium",
                        )}
                      >
                        {t.title}
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100"
                        aria-label="Delete conversation"
                        onClick={() => del.mutate(t.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {threads.data?.length === 0 && (
                    <p className="p-3 text-xs text-muted-foreground">No conversations yet.</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </aside>

        {/* Chat panel */}
        <section className="flex min-h-[70vh] flex-col rounded-xl border border-border/60 bg-card">
          <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
            {messages.length === 0 && !loaded.isLoading && (
              <div className="mx-auto max-w-2xl py-10 text-center">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-elegant">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold">How can I help today?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try one of these, or ask anything.
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-lg border border-border/60 bg-background p-3 text-left text-sm hover:border-primary/40 hover:bg-accent/40"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((m) =>
                m.role === "user" ? (
                  <UserBubble key={m.id} text={m.content} />
                ) : (
                  <AssistantMessage key={m.id} text={m.content} streaming={streaming} />
                ),
              )}
              {streaming &&
                messages.length > 0 &&
                messages[messages.length - 1].role === "assistant" &&
                messages[messages.length - 1].content === "" && <TypingIndicator />}
            </div>
          </div>

          <div className="border-t border-border/60 p-3 sm:p-4">
            <form
              className="mx-auto flex max-w-3xl items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <Textarea
                autoFocus
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Message the assistant… (Shift+Enter for newline)"
                className="min-h-[52px] max-h-40 flex-1 resize-none"
              />
              {streaming ? (
                <Button type="button" variant="secondary" onClick={stop} aria-label="Stop">
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={!input.trim()} aria-label="Send">
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </form>
            <div className="mx-auto mt-2 flex max-w-3xl items-center justify-between text-xs text-muted-foreground">
              <span>Enter to send · Shift+Enter for newline</span>
              {messages.some((m) => m.role === "assistant" && m.content) && !streaming && (
                <Button variant="ghost" size="sm" onClick={regenerate}>
                  <RotateCw className="mr-2 h-3 w-3" /> Regenerate
                </Button>
              )}
            </div>
            <div className="mx-auto max-w-3xl">
              <AiDisclaimer />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
        <div className="whitespace-pre-wrap">{text}</div>
      </div>
    </div>
  );
}

function AssistantMessage({ text, streaming }: { text: string; streaming: boolean }) {
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  };
  return (
    <div className="group">
      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="grid h-5 w-5 place-items-center rounded-md bg-brand-gradient text-primary-foreground">
          <Sparkles className="h-3 w-3" />
        </div>
        <span>Aivora</span>
      </div>
      {text ? <MarkdownView>{text}</MarkdownView> : streaming ? <TypingIndicator /> : null}
      {text && (
        <div className="mt-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="sm" onClick={copy}>
            <Copy className="mr-2 h-3 w-3" /> Copy
          </Button>
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-2 text-muted-foreground">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
    </div>
  );
}
