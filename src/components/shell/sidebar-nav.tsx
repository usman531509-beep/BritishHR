"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Home } from "lucide-react";
import { NAV, type NavSection } from "@/lib/nav";
import { cn } from "@/lib/utils";

const AREA_LABELS: Record<string, string> = {
  admin: "HR Administration",
  manager: "Manager Portal",
  me: "Employee Portal",
  external: "External Access",
  owner: "Platform Console",
};

export function SidebarNav({
  area,
  flags = [],
  onNavigate,
}: {
  area: string;
  flags?: string[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reveal the scrollbar while scrolling, then auto-hide after a short pause.
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    el.classList.add("is-scrolling");
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => el.classList.remove("is-scrolling"), 700);
  }

  const sections: NavSection[] = (NAV[area] ?? [])
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.flag || flags.includes(i.flag)) }))
    .filter((s) => s.items.length > 0);

  const isActive = (href: string) =>
    href === `/${area}` ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Brand — aligns with the topbar height (h-16) */}
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-brand font-extrabold text-white shadow-sm">
          C
        </span>
        <div className="leading-tight">
          <p className="font-display text-base font-extrabold tracking-tight text-foreground">CompliHR</p>
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
            {AREA_LABELS[area] ?? "Portal"}
          </p>
        </div>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="nav-scroll flex-1 overflow-y-auto">
        <nav className="px-3 py-4">
          {sections.map((section, i) => (
            <div key={i} className="mb-4 last:mb-0">
              {section.title ? (
                <p className="px-3 pb-1.5 pt-2 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.title}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-brand/12 font-semibold text-brand-dark"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        {active ? (
                          <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-brand" />
                        ) : null}
                        <Icon
                          className={cn(
                            "size-[18px] shrink-0",
                            active ? "text-brand-dark" : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                        {!item.ready ? (
                          <span className="ml-auto rounded-full bg-muted-foreground/15 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-muted-foreground">
                            soon
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-sidebar-border px-3 py-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Home className="size-[18px] shrink-0 text-muted-foreground" />
          <span>Back to home</span>
        </Link>
        <p className="flex items-center gap-1.5 px-3 text-[0.65rem] text-muted-foreground">
          <ShieldCheck className="size-3.5" /> UK-compliant • GDPR by design
        </p>
      </div>
    </div>
  );
}
