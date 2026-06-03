import type { ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyTableRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: string;
}) {
  return (
    <tr>
      <td className="py-8 text-center text-sm font-medium text-[var(--muted)]" colSpan={colSpan}>
        {children}
      </td>
    </tr>
  );
}

export function LoadingTableRow({ colSpan }: { colSpan: number }) {
  return (
    <TableSkeletonRows colSpan={colSpan} />
  );
}

export function FormError({ children }: { children: string }) {
  return (
    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
      {children}
    </p>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-slate-100 via-slate-200/75 to-slate-100",
        className,
      )}
    />
  );
}

export function TableSkeletonRows({
  colSpan,
  rows = 5,
}: {
  colSpan: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="border-b border-neutral-100">
          <td className="py-4 pr-4" colSpan={colSpan}>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${colSpan}, minmax(0, 1fr))` }}>
              {Array.from({ length: colSpan }).map((__, cellIndex) => (
                <SkeletonBlock
                  key={cellIndex}
                  className={cn(
                    "h-4",
                    cellIndex === 0 && "w-24",
                    cellIndex === colSpan - 1 && "w-20",
                  )}
                />
              ))}
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

export function ErrorTableRow({
  colSpan,
  title = "Data gagal dimuat",
  description = "Coba muat ulang data. Jika masih gagal, periksa koneksi atau sesi login.",
  onRetry,
}: {
  colSpan: number;
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-6">
        <QueryErrorState title={title} description={description} onRetry={onRetry} />
      </td>
    </tr>
  );
}

export function QueryErrorState({
  title = "Data gagal dimuat",
  description = "Coba muat ulang data. Jika masih gagal, periksa koneksi atau sesi login.",
  onRetry,
  children,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-rose-200 bg-rose-50/80 p-4 text-rose-900 shadow-sm shadow-rose-950/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-rose-700 shadow-sm shadow-rose-950/5">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="mt-1 text-sm leading-6 text-rose-700">{description}</p>
            {children ? <div className="mt-3">{children}</div> : null}
          </div>
        </div>
        {onRetry ? (
          <Button
            variant="outline"
            className="border-rose-200 bg-white text-rose-800 hover:border-rose-300 hover:bg-rose-50"
            onClick={onRetry}
          >
            <RefreshCcw className="h-4 w-4" />
            Muat Ulang
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm shadow-slate-900/4"
          >
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-10 w-10" />
            </div>
            <SkeletonBlock className="mt-7 h-9 w-24" />
            <SkeletonBlock className="mt-5 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm shadow-slate-900/4">
        <SkeletonBlock className="h-5 w-44" />
        <SkeletonBlock className="mt-2 h-4 w-72 max-w-full" />
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-20" />
          ))}
        </div>
      </div>
    </>
  );
}
