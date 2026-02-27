import clsx from "clsx";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60",
        {
          "bg-accent text-white hover:bg-accent/90": variant === "primary",
          "bg-panel-muted text-text hover:bg-panel": variant === "ghost"
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
