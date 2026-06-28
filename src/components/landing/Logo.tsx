import { useId } from "react";

type Props = {
  size?: number;
  className?: string;
};

export function LogoMark({ size = 28, className = "" }: Props) {
  const reactId = useId();
  const id = `nebula-logo-${reactId.replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-border`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="55%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(34,211,238,0.9)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0)" />
        </radialGradient>
      </defs>

      {/* Gradient outer border */}
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="8.5"
        fill={`url(#${id}-border)`}
      />
      {/* Dark inner face */}
      <rect x="2" y="2" width="28" height="28" rx="7" fill="#0b0b13" />
      {/* Top sheen */}
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="7"
        fill={`url(#${id}-sheen)`}
        opacity="0.6"
      />

      {/* Stylized N in gradient stroke */}
      <path
        d="M 22 11 A 7 7 0 1 0 22 21"
        stroke={`url(#${id}-stroke)`}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Live-status accent: glow + dot at the top-right terminator */}
      <circle cx="22" cy="10" r="3.5" fill={`url(#${id}-glow)`} />
      <circle cx="22" cy="10" r="1.7" fill="#22d3ee" />
    </svg>
  );
}

type LogoProps = {
  href?: string;
  className?: string;
  markSize?: number;
  showWordmark?: boolean;
};

export function Logo({
  href = "#",
  className = "",
  markSize = 28,
  showWordmark = true,
}: LogoProps) {
  return (
    <a
      href={href}
      className={`group inline-flex items-center gap-2.5 transition-opacity hover:opacity-90 ${className}`}
      aria-label="CompliHR UK"
    >
      <LogoMark size={markSize} />
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
          CompliHR
          <span className="ml-0.5 text-foreground/30">.</span>
        </span>
      )}
    </a>
  );
}
