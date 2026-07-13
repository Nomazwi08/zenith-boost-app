import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppTopbar } from "@/components/app-topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ListChecks,
  BookOpen,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Zap,
  History as HistoryIcon,
} from "lucide-react";
import { listPlans } from "@/lib/plans.functions";
import { listReports } from "@/lib/research.functions";
import { listThreads } from "@/lib/threads.functions";
import { AiDisclaimer } from "@/components/ai-disclaimer";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Aivora" }] }),
  component: Dashboard,
});

const tools = [
  {
    to: "/planner" as const,
    title: "AI Task Planner",
    description: "Turn any goal into a structured, prioritized action plan.",
    icon: ListChecks,
    accent: "from-indigo-500/20 to-violet-500/10",
  },
  {
    to: "/research" as const,
    title: "AI Research Assistant",
    description: "Generate professional research reports with insights and citations.",
    icon: BookOpen,
    accent: "from-sky-500/20 to-cyan-500/10",
  },
  {
    to: "/chat" as const,
    title: "AI Chat Assistant",
    description: "Ask anything. Draft, summarize, brainstorm, decide.",
    icon: MessageSquare,
    accent: "from-fuchsia-500/20 to-pink-500/10",
  },
];

function Dashboard() {
  const _plans = useServerFn(listPlans);
  const _reports = useServerFn(listReports);
  const _threads = useServerFn(listThreads);
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => _plans({}) });
  const reports = useQuery({ queryKey: ["reports"], queryFn: () => _reports({}) });
  const threads = useQuery({ queryKey: ["threads"], queryFn: () => _threads({}) });

  return (
    <>
      <AppTopbar title="Dashboard" subtitle="Your unified AI productivity workspace" />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-gradient opacity-20 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Powered by Lovable AI
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back. What will you ship today?
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Plan projects, run research, and chat with an AI copilot — all in one polished workspace.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/planner">
                  <Zap className="mr-2 h-4 w-4" /> New task plan
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/chat">Open chat</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <Card
              key={t.to}
              className="group relative overflow-hidden border-border/60 transition-shadow hover:shadow-elegant"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.accent} opacity-60`}
              />
              <CardHeader className="relative">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground shadow-elegant">
                  <t.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{t.title}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Button asChild variant="ghost" className="-ml-3">
                  <Link to={t.to}>
                    Open <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <RecentPanel
            title="Recent plans"
            emptyLabel="No task plans yet"
            items={(plans.data ?? []).slice(0, 4).map((p) => ({
              id: p.id,
              title: p.goal,
              href: `/planner/${p.id}`,
              meta: p.priority,
            }))}
            action={{ label: "New plan", to: "/planner" }}
          />
          <RecentPanel
            title="Recent research"
            emptyLabel="No research reports yet"
            items={(reports.data ?? []).slice(0, 4).map((r) => ({
              id: r.id,
              title: r.topic,
              href: `/research/${r.id}`,
              meta: r.depth,
            }))}
            action={{ label: "New research", to: "/research" }}
          />
          <RecentPanel
            title="Recent chats"
            emptyLabel="No conversations yet"
            items={(threads.data ?? []).slice(0, 4).map((t) => ({
              id: t.id,
              title: t.title,
              href: `/chat/${t.id}`,
              meta: new Date(t.updated_at).toLocaleDateString(),
            }))}
            action={{ label: "New chat", to: "/chat" }}
          />
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> Productivity tip
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Give the AI a specific outcome, a deadline, and any constraints. Concrete inputs
              produce concrete plans — vague inputs produce vague plans.
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HistoryIcon className="h-4 w-4 text-primary" /> Everything saves automatically
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Plans, reports, and conversations are saved to your account. Access them any time from
              the <Link to="/history" className="text-primary underline">History</Link> page.
            </CardContent>
          </Card>
        </section>

        <AiDisclaimer />
      </main>
    </>
  );
}

interface RecentItem {
  id: string;
  title: string;
  href: string;
  meta: string;
}
function RecentPanel({
  title,
  items,
  emptyLabel,
  action,
}: {
  title: string;
  items: RecentItem[];
  emptyLabel: string;
  action: { label: string; to: "/planner" | "/research" | "/chat" };
}) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link to={action.to}>{action.label}</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        )}
        {items.map((it) => (
          <a
            key={it.id}
            href={it.href}
            className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
          >
            <span className="min-w-0 truncate">{it.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{it.meta}</span>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
