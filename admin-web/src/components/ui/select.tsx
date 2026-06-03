import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-10 w-full cursor-pointer rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm shadow-slate-900/4 outline-none transition-all focus:border-[var(--brand-600)] focus:shadow-[var(--ring)] disabled:cursor-not-allowed disabled:bg-[var(--surface-soft)] disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}
