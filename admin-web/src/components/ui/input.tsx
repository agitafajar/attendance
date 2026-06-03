import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full cursor-text rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm shadow-slate-900/4 outline-none transition-all placeholder:font-normal placeholder:text-[var(--muted)] focus:border-[var(--brand-600)] focus:shadow-[var(--ring)] disabled:cursor-not-allowed disabled:bg-[var(--surface-soft)] disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}
