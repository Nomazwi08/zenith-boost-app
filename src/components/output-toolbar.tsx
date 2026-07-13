import { Button } from "@/components/ui/button";
import { Copy, Download, FileDown, Printer, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Props {
  content: string;
  filename?: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

export function OutputToolbar({ content, filename = "output", onRegenerate, regenerating }: Props) {
  const copy = async () => {
    await navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };
  const downloadMd = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const printPdf = () => {
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${filename}</title>
      <style>body{font-family:-apple-system,Segoe UI,system-ui,sans-serif;line-height:1.5;max-width:780px;margin:2rem auto;padding:0 1rem;color:#111;} pre{background:#f4f4f5;padding:1em;border-radius:.5em;overflow:auto} code{background:#f4f4f5;padding:.15em .35em;border-radius:.3em} h1,h2,h3{margin-top:1.4em} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ddd;padding:.4em .6em}</style>
      </head><body><pre style="white-space:pre-wrap;font-family:inherit;background:transparent;padding:0">${content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")}</pre>
      <script>window.onload=()=>{window.print();}</script></body></html>`;
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={copy}>
        <Copy className="mr-2 h-3.5 w-3.5" /> Copy
      </Button>
      <Button variant="outline" size="sm" onClick={downloadMd}>
        <Download className="mr-2 h-3.5 w-3.5" /> Markdown
      </Button>
      <Button variant="outline" size="sm" onClick={printPdf}>
        <FileDown className="mr-2 h-3.5 w-3.5" /> PDF
      </Button>
      {onRegenerate && (
        <Button variant="outline" size="sm" onClick={onRegenerate} disabled={regenerating}>
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`} />
          Regenerate
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={() => window.print()}>
        <Printer className="mr-2 h-3.5 w-3.5" /> Print
      </Button>
    </div>
  );
}
