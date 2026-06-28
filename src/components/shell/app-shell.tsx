"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { Topbar } from "./topbar";

export function AppShell({
  area,
  name,
  email,
  roleLabel,
  tenantName,
  flags = [],
  children,
}: {
  area: string;
  name: string | null;
  email: string;
  roleLabel: string;
  tenantName: string;
  flags?: string[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        <SidebarNav area={area} flags={flags} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarNav area={area} flags={flags} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          area={area}
          flags={flags}
          name={name}
          email={email}
          roleLabel={roleLabel}
          tenantName={tenantName}
          onMenu={() => setOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
