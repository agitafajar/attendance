import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string | boolean;
  className?: string;
};

const statusTones: Record<string, string> = {
  ACTIVE: "border-[var(--brand-900)]/20 bg-[var(--brand-900)]/8 text-[var(--brand-900)]",
  APPROVED: "border-[var(--brand-900)]/20 bg-[var(--brand-900)]/8 text-[var(--brand-900)]",
  PRESENT: "border-[var(--brand-900)]/20 bg-[var(--brand-900)]/8 text-[var(--brand-900)]",
  SUBMITTED: "border-[var(--brand-yellow)] bg-[var(--brand-yellow)]/35 text-[var(--brand-900)]",
  PENDING: "border-[var(--brand-yellow)] bg-[var(--brand-yellow)]/35 text-[var(--brand-900)]",
  PENDING_APPROVAL: "border-[var(--brand-yellow)] bg-[var(--brand-yellow)]/35 text-[var(--brand-900)]",
  LATE: "border-[var(--brand-500)]/35 bg-[var(--brand-500)]/12 text-[var(--brand-700)]",
  LEAVE: "border-[var(--brand-700)]/20 bg-[var(--brand-700)]/8 text-[var(--brand-700)]",
  DRAFT: "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted-strong)]",
  ABSENT: "border-[var(--brand-700)]/25 bg-[var(--brand-700)]/10 text-[var(--brand-700)]",
  REJECTED: "border-[var(--brand-700)]/25 bg-[var(--brand-700)]/10 text-[var(--brand-700)]",
  INACTIVE: "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted-strong)]",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label =
    typeof status === "boolean" ? (status ? "Active" : "Inactive") : status;
  const key = String(label).toUpperCase().replaceAll(" ", "_");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold leading-none",
        statusTones[key] ??
          "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted-strong)]",
        className,
      )}
    >
      {label}
    </span>
  );
}
