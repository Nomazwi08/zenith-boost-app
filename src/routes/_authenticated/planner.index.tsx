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
import { generatePlan, listPlans, deletePlan } from "@/lib/plans.functions";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/planner/")({
  head: () => ({ meta: [{ title: "Task Planner — Aivora" }] }),
  component: PlannerIndex,
});

function PlannerIndex() {
  const navigate = useNavigate();
  const _list = useServerFn(listPlans);
  const _gen = useServerFn(generatePlan);
  const _del = useServerFn(deletePlan);
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => _list({}) });

  const [goal, setGoal] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [deadline, setDeadline] = useState("");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");

  const gen = useMutation({
    mutationFn: () =>
      _gen({
        data: {
          goal: goal.trim(),
          priority,
          deadline: deadline || null,
          hours: hours ? Number(hours) : null,
          description: description.trim() || null,
        },
      }),
    onSuccess: ({ id }) => {
      toast.success("Plan generated");
      navigate({ to: "/planner/$planId", params: { planId: id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to generate plan"),
  });

  const del = useMutation({
    mutationFn: (id: string) => _del({ data: { id } }),
    onSuccess: () => {
      plans.refetch();
      toast.success("Plan deleted");
    },
  });

  const canSubmit = goal.trim().length > 3 && !gen.isPending;

  return (
    <>
      <AppTopbar title="AI Task Planner" subtitle="Convert goals into structured action plans" />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="border-border/60 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> New plan
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
                  <Label htmlFor="goal">Goal</Label>
                  <Input
                    id="goal"
                    placeholder="e.g. Launch v2 marketing site by end of Q3"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">Hours / week</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="1"
                      placeholder="e.g. 10"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Project description (optional)</Label>
                  <Textarea
                    id="desc"
                    rows={4}
                    placeholder="Context, constraints, stakeholders, current status…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={!canSubmit} className="min-w-40">
                    {gen.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" /> Generate plan
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
              <CardTitle className="text-base">Recent plans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {plans.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {plans.data?.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Your generated plans will appear here.
                </p>
              )}
              {plans.data?.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-md p-2 text-sm hover:bg-muted"
                >
                  <Link
                    to="/planner/$planId"
                    params={{ planId: p.id }}
                    className="min-w-0 flex-1 truncate"
                  >
                    <div className="truncate font-medium">{p.goal}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.priority} · {new Date(p.updated_at).toLocaleDateString()}
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    onClick={() => del.mutate(p.id)}
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
