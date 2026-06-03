"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
  onClose: () => void;
};

const sizes = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  size = "lg",
  onClose,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div
        className={cn(
          "flex max-h-[88vh] w-full flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-2xl shadow-slate-950/18",
          sizes[size],
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                {description}
              </p>
            ) : null}
          </div>
          <Button className="h-9 w-9 px-0" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border)] bg-[#f8faf9] px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
