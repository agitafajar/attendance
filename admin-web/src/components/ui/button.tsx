import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "danger";
};

const variants = {
  default:
    "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm shadow-teal-900/10 hover:bg-[var(--primary-hover)]",
  outline:
    "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm shadow-slate-900/5 hover:border-[var(--brand-700)]/35 hover:bg-[#f8fbfa]",
  ghost: "text-[var(--muted-strong)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]",
  danger:
    "bg-red-700 text-white shadow-sm shadow-red-900/10 hover:bg-red-800",
};

export function Button({
  className,
  variant = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-all focus-visible:shadow-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
