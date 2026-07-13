import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AppTopbar } from "@/components/app-topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getReport, updateReportContent } from "@/lib/research.functions";
import { MarkdownView } from "@/components/markdown-view";
import { OutputToolbar } from "@/components/output-toolbar";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { ArrowLeft, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/research/$reportId")({
  head: () => ({ meta: [{ title: "Report — Aivora" }] }),
  component: ReportDetail,
});

function ReportDetail() {
  const { reportId } = Route.useParams();
  const _get = useServerFn(getReport);
  const _update = useServerFn(updateReportContent);
  const report = useQuery({
    queryKey: ["report", reportId],
    queryFn: () => _get({ data: { id: reportId } }),
  });
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (report.data?.content) setContent(report.data.content);
  }, [report.data?.content]);

  const save = useMutation({
    mutationFn: () => _update({ data: { id: reportId, content } }),
    onSuccess: () => {
      toast.success("Saved");
      report.refetch();
    },
  });

  if (report.isLoading) {
    return (
      <>
        <AppTopbar title="Report" />
        <main className="mx-auto max-w-4xl p-8 text-muted-foreground">Loading…</main>
      </>
    );
  }
  if (!report.data) {
    return (
      <>
        <AppTopbar title="Report not found" />
        <main className="mx-auto max-w-4xl p-8">
          <Button asChild variant="outline">
            <Link to="/research">Back</Link>
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      <AppTopbar title={report.data.topic} subtitle={`${report.data.depth} report`} />
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/research">
              <ArrowLeft className="mr-2 h-4 w-4" /> All reports
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
                  rows={28}
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
            filename={`research-${report.data.topic.slice(0, 40).replace(/\s+/g, "-")}`}
          />
        </div>
        <AiDisclaimer />
      </main>
    </>
  );
}
