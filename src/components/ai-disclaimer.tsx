import { Info } from "lucide-react";

export function AiDisclaimer() {
  return (
    <div className="mt-6 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p>
        AI-generated content may contain inaccuracies or incomplete information. Always review and
        verify outputs before using them for business, legal, financial, medical, or other important
        decisions.
      </p>
    </div>
  );
}
