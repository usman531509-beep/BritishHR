import type { ReactNode } from "react";

type Props = {
  className?: string;
  children: ReactNode;
  glow?: string;
};

export function BentoCard({ className = "", children }: Props) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl glass p-7 transition-[transform,background-color] duration-300 ease-out hover:-translate-y-1 hover:bg-foreground/[0.06] ${className}`}
    >
      <div className="relative h-full">{children}</div>
    </div>
  );
}
