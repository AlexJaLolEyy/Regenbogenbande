"use client";

import { cn } from "@/src/lib/utils";
import { ChevronRight, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MainSidebar } from "./main-sidebar";
import { SidebarProvider, useSidebar } from "./sidebar-context";

const LABELS: Record<string, string> = {
  videos: "Videos",
  pictures: "Pictures",
  quotes: "Quotes",
  profile: "Profile",
  admin: "Admin",
  categories: "Categories",
  users: "Users",
  content: "Content",
  upload: "Upload",
  edit: "Edit",
};

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Skip opaque ids (uuid / cuid-like) so crumbs stay readable.
  const crumbs = segments
    .map((seg, i) => ({
      href: "/" + segments.slice(0, i + 1).join("/"),
      label: LABELS[seg] ?? (seg.length > 12 ? null : seg),
    }))
    .filter((c): c is { href: string; label: string } => c.label !== null);

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
      <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
        Overview
      </Link>
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex min-w-0 items-center gap-1.5">
          <ChevronRight size={14} className="shrink-0 text-faint" />
          {i === crumbs.length - 1 ? (
            <span className="truncate font-medium text-foreground">{c.label}</span>
          ) : (
            <Link href={c.href} className="truncate text-muted-foreground transition-colors hover:text-foreground">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { collapsed, setMobileOpen } = useSidebar();

  // Login and the landing page are standalone: no app chrome.
  if (pathname === "/" || pathname.startsWith("/login")) return <>{children}</>;


  return (
    <>
      <MainSidebar />
      <div
        style={{ "--sidebar-w": collapsed ? "72px" : "16rem" } as React.CSSProperties}
        className="min-h-screen transition-[padding] duration-300 ease-out md:pl-(--sidebar-w)"
      >
        <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted md:hidden"
          >
            <Menu size={20} />
          </button>
          <Breadcrumbs />
        </header>
        {children}
      </div>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Shell>{children}</Shell>
    </SidebarProvider>
  );
}
