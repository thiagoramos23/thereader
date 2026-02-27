import clsx from "clsx";
import type { HTMLAttributes, PropsWithChildren } from "react";

export function Panel({ className, children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={clsx("rounded-xl border border-border/80 bg-panel shadow-panel", className)} {...props}>
      {children}
    </div>
  );
}
