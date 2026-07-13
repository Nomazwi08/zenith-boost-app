import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppTopbar } from "@/components/app-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { generateReport, listReports, deleteReport } from "@/lib/research.functions";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/research/")({
  head: () => ({ meta: [{ title: "Research — Aivora" }] }),
  component: ResearchIndex,
});

function ResearchIndex() {
  const navigate = useNavigate();
  const _list = useServerFn(listReports);
  const _gen = useServerFn(generateReport);
  const _del = useServerFn(deleteReport);
  const reports = useQuery({ queryKey: ["reports"], queryFn: () => _list({}) });

  const [topic, setTopic] = useState("");
  const [objective, setObjective] = useState("");
  const [audience, setAudience] = useState("Business professionals");
  const [depth, setDepth] = useState<"Basic" | "Standard" | "Detailed">("Standard");

  const gen = useMutation({
    mutationFn: () =>
      _gen({
        data: {
          topic: topic.trim(),
          objective: objective.trim() || null,
          audience: audience.trim() || null,
          depth,
        },
      }),
    onSuccess: ({ id }) => {
      toast.success("Research ready");
      navigate({ to: "/research/$reportId", params: { reportId: id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => _del({ data: { id } }),
    onSuccess: () => {
      reports.refetch();
      toast.success("Deleted");
    },
  });

  const canSubmit = topic.trim().length > 2 && !gen.isPending;

  return (
    <>
      <AppTopbar title="AI Research Assistant" subtitle="Structured research on any topic" />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="border-border/60 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> New research
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (canSubmit) gen.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g. State of AI in enterprise CX in 2026"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objective">Objective</Label>
                  <Textarea
                    id="objective"
                    rows={3}
                    placeholder="What decision or outcome will this inform?"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="audience">Audience</Label>
                    <Input
                      id="audience"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Depth</Label>
                    <Select value={depth} onValueChange={(v) => setDepth(v as typeof depth)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Basic">Basic</SelectItem>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={!canSubmit} className="min-w-40">
                    {gen.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Researching…
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" /> Generate report
                      </>
                    )}
                  </Button>
                </div>
                <AiDisclaimer />
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Recent reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {reports.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {reports.data?.length === 0 && (
                <p className="text-sm text-muted-foreground">Your reports will appear here.</p>
              )}
              {reports.data?.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-md p-2 text-sm hover:bg-muted"
                >
                  <Link
                    to="/research/$reportId"
                    params={{ reportId: r.id }}
                    className="min-w-0 flex-1 truncate"
                  >
                    <div className="truncate font-medium">{r.topic}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.depth} · {new Date(r.updated_at).toLocaleDateString()}
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    onClick={() => del.mutate(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
