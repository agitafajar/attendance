import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-10 w-full cursor-pointer rounded-md border border-[#cfc7b8] bg-white px-3 py-2 text-sm text-[#17211d] outline-none transition-colors focus:border-[#197c68] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
