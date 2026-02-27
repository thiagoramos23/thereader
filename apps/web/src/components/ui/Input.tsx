import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm text-text placeholder:text-textMuted/80 focus:border-accent focus:outline-none",
        className
      )}
      {...props}
    />
  );
}
