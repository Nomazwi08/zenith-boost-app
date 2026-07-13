import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppTopbar } from "@/components/app-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listPlans } from "@/lib/plans.functions";
import { listReports } from "@/lib/research.functions";
import { listThreads } from "@/lib/threads.functions";
import { BookOpen, ListChecks, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — Aivora" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const _plans = useServerFn(listPlans);
  const _reports = useServerFn(listReports);
  const _threads = useServerFn(listThreads);
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => _plans({}) });
  const reports = useQuery({ queryKey: ["reports"], queryFn: () => _reports({}) });
  const threads = useQuery({ queryKey: ["threads"], queryFn: () => _threads({}) });

  return (
    <>
      <AppTopbar title="History" subtitle="All your saved outputs" />
      <main className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 sm:px-6 lg:grid-cols-3">
        <Column
          title="Task plans"
          icon={ListChecks}
          items={(plans.data ?? []).map((p) => ({
            id: p.id,
            title: p.goal,
            meta: `${p.priority} · ${new Date(p.updated_at).toLocaleDateString()}`,
            href: `/planner/${p.id}`,
          }))}
        />
        <Column
          title="Research reports"
          icon={BookOpen}
          items={(reports.data ?? []).map((r) => ({
            id: r.id,
            title: r.topic,
            meta: `${r.depth} · ${new Date(r.updated_at).toLocaleDateString()}`,
            href: `/research/${r.id}`,
          }))}
        />
        <Column
          title="Chat conversations"
          icon={MessageSquare}
          items={(threads.data ?? []).map((t) => ({
            id: t.id,
            title: t.title,
            meta: new Date(t.updated_at).toLocaleDateString(),
            href: `/chat/${t.id}`,
          }))}
        />
      </main>
    </>
  );
}

interface HistoryItem {
  id: string;
  title: string;
  meta: string;
  href: string;
}
function Column({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: HistoryItem[];
}) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Nothing here yet.</p>}
        {items.map((it) => (
          <Link
            key={it.id}
            to={it.href}
            className="block rounded-md p-2 text-sm hover:bg-muted"
          >
            <div className="truncate font-medium">{it.title}</div>
            <div className="text-xs text-muted-foreground">{it.meta}</div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
