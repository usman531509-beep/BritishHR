"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Direction = "up" | "left" | "right" | "down";

type Props = {
  children: ReactNode;
  className?: string;
  /** Slide direction the element comes from. Default: "up". */
  direction?: Direction;
  /** ms — delay before the transition kicks in once visible */
  delay?: number;
  /** px — magnitude of the from-state offset */
  distance?: number;
  /** ms — transition duration */
  duration?: number;
};

const offsetFor = (direction: Direction, distance: number) => {
  switch (direction) {
    case "left":
      return `translate3d(-${distance}px, 0, 0)`;
    case "right":
      return `translate3d(${distance}px, 0, 0)`;
    case "down":
      return `translate3d(0, -${distance}px, 0)`;
    case "up":
    default:
      return `translate3d(0, ${distance}px, 0)`;
  }
};

/**
 * Lightweight scroll-reveal. Single IntersectionObserver that disconnects
 * after firing, then CSS transitions on opacity + transform. No motion lib.
 */
export function Reveal({
  children,
  className = "",
  direction = "up",
  delay = 0,
  distance,
  duration = 500,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Sensible default distance per direction (sideways needs more travel)
  const d =
    distance ?? (direction === "left" || direction === "right" ? 36 : 14);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reveal immediately when motion is reduced
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : offsetFor(direction, d),
        transition: `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        willChange: visible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

/** Kept as a no-op pass-through for backwards compatibility. */
export function StaggerGroup({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export const staggerItem = {};
