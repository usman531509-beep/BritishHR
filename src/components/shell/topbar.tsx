"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { Menu, Bell, LogOut, Palette, Check, Sun, Moon, User, Home } from "lucide-react";
import { CommandMenu } from "./command-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";

const ACCENTS = [
  { key: "azure", color: "#3b82f6" },
  { key: "sky", color: "#0ea5e9" },
  { key: "indigo", color: "#6366f1" },
  { key: "violet", color: "#7c3aed" },
  { key: "emerald", color: "#059669" },
  { key: "slate", color: "#475569" },
] as const;

const PORTAL_LABEL: Record<string, string> = {
  admin: "HR Administration",
  manager: "Manager",
  me: "Employee",
  external: "External",
  owner: "Platform",
};

function humanize(seg: string) {
  if (/^[a-z0-9]{20,}$/i.test(seg)) return "Details";
  return seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Topbar({
  name,
  email,
  roleLabel,
  tenantName,
  area,
  flags = [],
  onMenu,
}: {
  name: string | null;
  email: string;
  roleLabel: string;
  tenantName: string;
  area: string;
  flags?: string[];
  onMenu: () => void;
}) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [accent, setAccent] = useState("azure");

  useEffect(() => {
    try {
      const t = localStorage.getItem("complihr-accent");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync accent from persisted storage on mount
      if (t) setAccent(t);
      if (t) document.documentElement.setAttribute("data-theme", t);
    } catch {}
  }, []);

  function applyAccent(t: string) {
    document.documentElement.setAttribute("data-theme", t);
    setAccent(t);
    try {
      localStorage.setItem("complihr-accent", t);
    } catch {}
  }

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.slice(1); // drop the portal root segment

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur-md lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu />
      </Button>

      <Breadcrumb className="min-w-0">
        <BreadcrumbList>
          <BreadcrumbItem className="text-muted-foreground">{PORTAL_LABEL[area] ?? "Portal"}</BreadcrumbItem>
          {crumbs.length === 0 ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Overview</BreadcrumbPage></BreadcrumbItem>
            </>
          ) : (
            crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {i === crumbs.length - 1 ? <BreadcrumbPage>{humanize(c)}</BreadcrumbPage> : <span className="text-muted-foreground">{humanize(c)}</span>}
                </BreadcrumbItem>
              </span>
            ))
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1.5">
        <CommandMenu area={area} flags={flags} />

        {/* Accent theme */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Accent colour"><Palette /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Accent colour</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ACCENTS.map((a) => (
              <DropdownMenuItem key={a.key} onClick={() => applyAccent(a.key)} className="capitalize">
                <span className="size-3.5 rounded-full" style={{ background: a.color }} />
                {a.key}
                {accent === a.key ? <Check className="ml-auto size-4" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dark mode */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle dark mode"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {/* Render both; CSS toggles by the `dark` class to avoid hydration mismatch */}
          <Sun className="hidden dark:block" />
          <Moon className="block dark:hidden" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-danger" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex-col items-start gap-0.5">
              <span className="text-sm font-medium">Right-to-Work expiring</span>
              <span className="text-xs text-muted-foreground">A visa expires within 60 days</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex-col items-start gap-0.5">
              <span className="text-sm font-medium">Leave awaiting approval</span>
              <span className="text-xs text-muted-foreground">Pending requests in your queue</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-muted">
              <Avatar className="size-8">
                <AvatarFallback className="bg-brand/15 text-xs font-bold text-brand-dark">
                  {initials(name?.split(" ")[0], name?.split(" ")[1])}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium leading-tight">{name ?? email}</span>
                <span className="block text-xs leading-tight text-muted-foreground">{roleLabel}</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">{name ?? "Account"}</span>
              <span className="text-xs font-normal text-muted-foreground">{email}</span>
              <span className="mt-1 text-xs font-normal text-muted-foreground">{tenantName}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account">
                <User /> Profile &amp; account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/">
                <Home /> Home page
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
