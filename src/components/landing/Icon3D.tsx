import type { ReactNode } from "react";

type IconProps = {
  name:
    | "spark"
    | "cube"
    | "shield"
    | "bolt"
    | "globe"
    | "chip"
    | "wave"
    | "stack"
    | "orbit";
  className?: string;
};

const palettes: Record<IconProps["name"], [string, string, string]> = {
  spark: ["#a78bfa", "#7c3aed", "#3b0764"],
  cube: ["#f472b6", "#d946ef", "#581c87"],
  shield: ["#34d399", "#10b981", "#064e3b"],
  bolt: ["#fde047", "#f59e0b", "#7c2d12"],
  globe: ["#60a5fa", "#22d3ee", "#0c4a6e"],
  chip: ["#fb7185", "#f43f5e", "#4c0519"],
  wave: ["#22d3ee", "#0ea5e9", "#0c4a6e"],
  stack: ["#c084fc", "#8b5cf6", "#3b0764"],
  orbit: ["#f0abfc", "#d946ef", "#4a044e"],
};

function Wrapper({
  children,
  className = "",
  light = "#a78bfa",
}: {
  children: ReactNode;
  className?: string;
  light?: string;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <div
        aria-hidden
        className="absolute -inset-3 rounded-2xl blur-2xl opacity-60"
        style={{
          background: `radial-gradient(closest-side, ${light}55, transparent 70%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export function Icon3D({ name, className = "" }: IconProps) {
  const [a, b, c] = palettes[name];

  const id = `g-${name}`;
  const idEdge = `e-${name}`;
  const idShine = `s-${name}`;

  const defs = (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={a} />
        <stop offset="55%" stopColor={b} />
        <stop offset="100%" stopColor={c} />
      </linearGradient>
      <linearGradient id={idEdge} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
        <stop offset="60%" stopColor="rgba(255,255,255,0.05)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
      </linearGradient>
      <radialGradient id={idShine} cx="30%" cy="20%" r="60%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
        <stop offset="60%" stopColor="rgba(255,255,255,0)" />
      </radialGradient>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="0.6" />
      </filter>
    </defs>
  );

  const shape = (() => {
    switch (name) {
      case "spark":
        return (
          <>
            <path
              d="M32 6 L36 24 L54 28 L36 32 L32 50 L28 32 L10 28 L28 24 Z"
              fill={`url(#${id})`}
              stroke={`url(#${idEdge})`}
              strokeWidth="1.2"
            />
            <path
              d="M32 6 L36 24 L54 28 L36 32 L32 50 L28 32 L10 28 L28 24 Z"
              fill={`url(#${idShine})`}
              opacity="0.7"
            />
          </>
        );
      case "cube":
        return (
          <>
            <path d="M32 8 L54 20 L32 32 L10 20 Z" fill={`url(#${id})`} />
            <path
              d="M10 20 L32 32 L32 56 L10 44 Z"
              fill={b}
              opacity="0.85"
            />
            <path d="M54 20 L32 32 L32 56 L54 44 Z" fill={c} opacity="0.95" />
            <path
              d="M32 8 L54 20 L32 32 L10 20 Z"
              fill={`url(#${idShine})`}
              opacity="0.55"
            />
          </>
        );
      case "shield":
        return (
          <>
            <path
              d="M32 6 L54 14 V30 C54 44 44 52 32 58 C20 52 10 44 10 30 V14 Z"
              fill={`url(#${id})`}
              stroke={`url(#${idEdge})`}
              strokeWidth="1.2"
            />
            <path
              d="M22 30 L29 37 L43 23"
              fill="none"
              stroke="rgba(255,255,255,0.95)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M32 6 L54 14 V30 C54 44 44 52 32 58 C20 52 10 44 10 30 V14 Z"
              fill={`url(#${idShine})`}
              opacity="0.45"
            />
          </>
        );
      case "bolt":
        return (
          <>
            <path
              d="M36 4 L14 34 H28 L24 60 L52 28 H36 L42 4 Z"
              fill={`url(#${id})`}
              stroke={`url(#${idEdge})`}
              strokeWidth="1.2"
            />
            <path
              d="M36 4 L14 34 H28 L24 60 L52 28 H36 L42 4 Z"
              fill={`url(#${idShine})`}
              opacity="0.6"
            />
          </>
        );
      case "globe":
        return (
          <>
            <circle cx="32" cy="32" r="24" fill={`url(#${id})`} />
            <ellipse
              cx="32"
              cy="32"
              rx="24"
              ry="10"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1.5"
            />
            <ellipse
              cx="32"
              cy="32"
              rx="10"
              ry="24"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1.5"
            />
            <ellipse
              cx="32"
              cy="32"
              rx="24"
              ry="24"
              fill="none"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.2"
            />
            <circle
              cx="32"
              cy="32"
              r="24"
              fill={`url(#${idShine})`}
              opacity="0.5"
            />
          </>
        );
      case "chip":
        return (
          <>
            <rect
              x="14"
              y="14"
              width="36"
              height="36"
              rx="8"
              fill={`url(#${id})`}
              stroke={`url(#${idEdge})`}
              strokeWidth="1.2"
            />
            <rect
              x="22"
              y="22"
              width="20"
              height="20"
              rx="3"
              fill="rgba(0,0,0,0.35)"
            />
            <rect
              x="22"
              y="22"
              width="20"
              height="20"
              rx="3"
              fill="none"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="1.2"
            />
            {[18, 28, 38, 48].map((y) => (
              <rect
                key={`l-${y}`}
                x="6"
                y={y - 2}
                width="8"
                height="3"
                rx="1.2"
                fill={c}
              />
            ))}
            {[18, 28, 38, 48].map((y) => (
              <rect
                key={`r-${y}`}
                x="50"
                y={y - 2}
                width="8"
                height="3"
                rx="1.2"
                fill={c}
              />
            ))}
            <rect
              x="14"
              y="14"
              width="36"
              height="36"
              rx="8"
              fill={`url(#${idShine})`}
              opacity="0.4"
            />
          </>
        );
      case "wave":
        return (
          <>
            <path
              d="M6 38 C16 22, 26 54, 36 38 S56 22, 60 38 L60 56 L6 56 Z"
              fill={`url(#${id})`}
            />
            <path
              d="M6 28 C16 12, 26 44, 36 28 S56 12, 60 28"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M6 38 C16 22, 26 54, 36 38 S56 22, 60 38 L60 56 L6 56 Z"
              fill={`url(#${idShine})`}
              opacity="0.45"
            />
          </>
        );
      case "stack":
        return (
          <>
            <ellipse cx="32" cy="50" rx="22" ry="6" fill={c} />
            <path
              d="M10 50 L10 38 C10 41 22 44 32 44 C42 44 54 41 54 38 L54 50 C54 53 42 56 32 56 C22 56 10 53 10 50 Z"
              fill={b}
            />
            <ellipse cx="32" cy="38" rx="22" ry="6" fill={a} />
            <path
              d="M10 38 L10 26 C10 29 22 32 32 32 C42 32 54 29 54 26 L54 38 C54 41 42 44 32 44 C22 44 10 41 10 38 Z"
              fill={b}
              opacity="0.85"
            />
            <ellipse cx="32" cy="26" rx="22" ry="6" fill={`url(#${id})`} />
            <ellipse
              cx="32"
              cy="26"
              rx="22"
              ry="6"
              fill={`url(#${idShine})`}
              opacity="0.6"
            />
          </>
        );
      case "orbit":
        return (
          <>
            <ellipse
              cx="32"
              cy="32"
              rx="26"
              ry="10"
              fill="none"
              stroke={a}
              strokeWidth="1.6"
              transform="rotate(-25 32 32)"
              opacity="0.7"
            />
            <ellipse
              cx="32"
              cy="32"
              rx="26"
              ry="10"
              fill="none"
              stroke={b}
              strokeWidth="1.6"
              transform="rotate(35 32 32)"
              opacity="0.7"
            />
            <circle cx="32" cy="32" r="10" fill={`url(#${id})`} />
            <circle cx="32" cy="32" r="10" fill={`url(#${idShine})`} opacity="0.6" />
            <circle cx="56" cy="22" r="3.2" fill={a} />
            <circle cx="10" cy="44" r="2.6" fill={b} />
          </>
        );
    }
  })();

  return (
    <Wrapper className={className} light={a}>
      <svg
        viewBox="0 0 64 64"
        width="64"
        height="64"
        className="drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)]"
      >
        {defs}
        {shape}
      </svg>
    </Wrapper>
  );
}
