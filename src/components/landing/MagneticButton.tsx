import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "ghost";
  className?: string;
  onClick?: () => void;
};

export function MagneticButton({
  children,
  href,
  variant = "primary",
  className = "",
  onClick,
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-7 h-12 text-sm font-medium tracking-tight transition-colors select-none";
  const styles =
    variant === "primary"
      ? "text-black bg-white hover:bg-white/90"
      : "text-white/90 hover:text-white glass hover:bg-white/[0.08]";
  const cls = `${base} ${styles} ${className}`;

  if (href) {
    return (
      <a href={href} className={cls} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick}>
      {children}
    </button>
  );
}
