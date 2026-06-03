import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
};

const variants = {
  default: "bg-[#17211d] text-white shadow-sm hover:bg-[#26332d]",
  outline: "border border-[#cfc7b8] bg-white text-[#17211d] hover:bg-[#f0eadf]",
  ghost: "text-[#17211d] hover:bg-[#f0eadf]",
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
        "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
