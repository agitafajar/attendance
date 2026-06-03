import { cn } from "@/lib/utils";

type SummaryChipProps = {
  label: string;
  value: string;
  tone?: "default" | "teal" | "amber";
  className?: string;
};

const tones = {
  default: "border-[var(--border)] bg-[#f8faf9] text-[var(--muted-strong)]",
  teal: "border-teal-200 bg-teal-50 text-teal-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
};

export function SummaryChip({
  label,
  value,
  tone = "default",
  className,
}: SummaryChipProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-2 rounded-md border px-2.5 py-1 text-xs",
        tones[tone],
        className,
      )}
    >
      <span className="font-semibold">{label}</span>
      <span className="text-current opacity-70">{value}</span>
    </span>
  );
}
