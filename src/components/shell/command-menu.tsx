"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; section: string; ready?: boolean; Icon: React.ComponentType<{ className?: string }> };

export function CommandMenu({ area, flags = [] }: { area: string; flags?: string[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  // Flatten the nav into a searchable list (respecting feature flags).
  const items: Item[] = React.useMemo(() => {
    const out: Item[] = [];
    for (const section of NAV[area] ?? []) {
      for (const it of section.items) {
        if (it.flag && !flags.includes(it.flag)) continue;
        out.push({ href: it.href, label: it.label, section: section.title ?? "Navigation", ready: it.ready, Icon: it.icon });
      }
    }
    return out;
  }, [area, flags]);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q) || i.section.toLowerCase().includes(q));
  }, [items, query]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Search"
        onClick={() => setOpen(true)}
      >
        <Search />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>Find a page or module</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages and modules…"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No results found.</p>
            ) : (
              <ul className="space-y-0.5">
                {results.map((r) => {
                  const Icon = r.Icon;
                  return (
                    <li key={r.href}>
                      <button
                        onClick={() => go(r.href)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                        )}
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate">{r.label}</span>
                        <span className="text-xs text-muted-foreground">{r.section}</span>
                        {!r.ready ? <span className="text-[0.6rem] uppercase text-muted-foreground">soon</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
