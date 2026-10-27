// Pure presentational component: props in, JSX out. No framework imports, no data
// fetching, no routing. This is the layer that ports to Next.js unchanged.
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  icon?: ReactNode;
};

export function Button({ variant = "primary", icon, className = "", children, ...rest }: Props) {
  const base =
    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-neutral-900 text-white hover:bg-neutral-700"
      : "text-neutral-700 hover:bg-neutral-100";
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {icon}
      {children}
    </button>
  );
}
