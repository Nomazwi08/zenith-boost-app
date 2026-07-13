import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AppTopbar } from "@/components/app-topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getPlan, updatePlanContent } from "@/lib/plans.functions";
import { MarkdownView } from "@/components/markdown-view";
import { OutputToolbar } from "@/components/output-toolbar";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { ArrowLeft, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/planner/$planId")({
  head: () => ({ meta: [{ title: "Plan — Aivora" }] }),
  component: PlanDetail,
});

function PlanDetail() {
  const { planId } = Route.useParams();
  const _get = useServerFn(getPlan);
  const _update = useServerFn(updatePlanContent);
  const plan = useQuery({ queryKey: ["plan", planId], queryFn: () => _get({ data: { id: planId } }) });
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (plan.data?.content) setContent(plan.data.content);
  }, [plan.data?.content]);

  const save = useMutation({
    mutationFn: () => _update({ data: { id: planId, content } }),
    onSuccess: () => {
      toast.success("Saved");
      plan.refetch();
    },
  });

  if (plan.isLoading) {
    return (
      <>
        <AppTopbar title="Plan" />
        <main className="mx-auto max-w-4xl p-8 text-muted-foreground">Loading…</main>
      </>
    );
  }
  if (!plan.data) {
    return (
      <>
        <AppTopbar title="Plan not found" />
        <main className="mx-auto max-w-4xl p-8">
          <Button asChild variant="outline">
            <Link to="/planner">Back to planner</Link>
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      <AppTopbar title={plan.data.goal} subtitle={`Priority: ${plan.data.priority}`} />
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/planner">
              <ArrowLeft className="mr-2 h-4 w-4" /> All plans
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={mode === "view" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("view")}
            >
              <Eye className="mr-2 h-4 w-4" /> View
            </Button>
            <Button
              variant={mode === "edit" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("edit")}
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          </div>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-6">
            {mode === "view" ? (
              <MarkdownView>{content}</MarkdownView>
            ) : (
              <>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={24}
                  className="font-mono text-sm"
                />
                <div className="mt-3 flex justify-end">
                  <Button onClick={() => save.mutate()} disabled={save.isPending}>
                    Save changes
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-4">
          <OutputToolbar
            content={content}
            filename={`plan-${plan.data.goal.slice(0, 40).replace(/\s+/g, "-")}`}
          />
        </div>
        <AiDisclaimer />
      </main>
    </>
  );
}
