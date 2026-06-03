import { Loader2 } from "lucide-react";

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
    <tr>
      <td className="py-8 text-center text-sm font-medium text-[var(--muted)]" colSpan={colSpan}>
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-700)]" />
          Memuat data...
        </span>
      </td>
    </tr>
  );
}

export function FormError({ children }: { children: string }) {
  return (
    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
      {children}
    </p>
  );
}
