import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: number;
  withWordmark?: boolean;
}

export function BrandLogo({ className, size = 32, withWordmark = false }: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="grid place-items-center rounded-xl bg-brand-gradient text-primary-foreground shadow-elegant"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="none">
          <path
            d="M4 20L10.5 5h3L20 20h-3l-1.5-3.5h-7L7 20H4zm5.5-6h5L12 8l-2.5 6z"
            fill="currentColor"
          />
          <circle cx="19" cy="6" r="2" fill="currentColor" opacity="0.7" />
        </svg>
      </div>
      {withWordmark && (
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">Aivora</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Productivity AI
          </div>
        </div>
      )}
    </div>
  );
}
