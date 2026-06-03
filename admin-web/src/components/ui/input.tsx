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
        "flex h-10 w-full cursor-text rounded-md border border-[#cfc7b8] bg-white px-3 py-2 text-sm text-[#17211d] outline-none transition-colors placeholder:text-[#9b9487] focus:border-[#197c68] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
