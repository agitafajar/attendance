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
  DRAFT: "border-stone-200 bg-stone-50 text-stone-600",
  ABSENT: "border-rose-200 bg-rose-50 text-rose-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  INACTIVE: "border-stone-200 bg-stone-50 text-stone-600",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label =
    typeof status === "boolean" ? (status ? "Active" : "Inactive") : status;
  const key = String(label).toUpperCase().replaceAll(" ", "_");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold leading-none",
        statusTones[key] ?? "border-stone-200 bg-stone-50 text-stone-700",
        className,
      )}
    >
      {label}
    </span>
  );
}
