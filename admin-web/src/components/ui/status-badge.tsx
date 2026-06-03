import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string | boolean;
  className?: string;
};

const statusTones: Record<string, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PRESENT: "border-emerald-200 bg-emerald-50 text-emerald-700",
  SUBMITTED: "border-amber-200 bg-amber-50 text-amber-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  PENDING_APPROVAL: "border-amber-200 bg-amber-50 text-amber-700",
  LATE: "border-orange-200 bg-orange-50 text-orange-700",
  LEAVE: "border-sky-200 bg-sky-50 text-sky-700",
  DRAFT: "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted-strong)]",
  ABSENT: "border-red-200 bg-red-50 text-red-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
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
