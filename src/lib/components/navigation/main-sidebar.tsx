"use client";

import { signOut, useSession } from "@/src/lib/auth-client";
import { cn } from "@/src/lib/utils";
import { Skeleton } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Crown,
  Database,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  LogIn,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Quote,
  Settings,
  Shield,
  Sun,
  User,
  Users,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import NextImage from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EffectiveRole, getEffectiveRole } from "../../auth-utils-shared";
import { useSidebar } from "./sidebar-context";

interface NavEntry {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roles allowed to see this entry. Omitted = everyone. */
  roles?: EffectiveRole[];
  /** Match exactly instead of by prefix. */
  exact?: boolean;
}

const SECTIONS: { title: string; items: NavEntry[] }[] = [
  {
    title: "Main Menu",
    items: [
      { label: "Overview", href: "/", icon: Home, exact: true },
      { label: "Videos", href: "/videos", icon: Video },
      { label: "Pictures", href: "/pictures", icon: ImageIcon },
      { label: "Quotes", href: "/quotes", icon: Quote },
      { label: "Analytics", href: "/profile", icon: BarChart3, roles: ["owner", "admin", "member"] },
    ],
  },
  {
    title: "Settings & More",
    items: [
      { label: "Settings", href: "/profile", icon: Settings, roles: ["owner", "admin", "member"] },
      { label: "Categories", href: "/admin/categories", icon: LayoutGrid, roles: ["owner", "admin"] },
      { label: "Users", href: "/admin/users", icon: Users, roles: ["owner", "admin"] },
      { label: "Content", href: "/admin/content", icon: Database, roles: ["owner"] },
    ],
  },
];

const ROLE_META: Record<EffectiveRole, { label: string; icon: LucideIcon }> = {
  owner: { label: "Owner", icon: Crown },
  admin: { label: "Admin", icon: Shield },
  member: { label: "Member", icon: User },
  guest: { label: "Guest", icon: User },
};

export function RolePill({ role }: { role: EffectiveRole }) {
  const { label, icon: Icon } = ROLE_META[role];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      <Icon size={11} />
      {label}
    </span>
  );
}

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-0"
      )}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      {!collapsed && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}

function SidebarContent({
  collapsed,
  onNavigate,
  onClose,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const role = getEffectiveRole(session);
  const { toggleCollapsed } = useSidebar();

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
          router.refresh();
        },
      },
    });
  };

  const isActive = (item: NavEntry) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  // The same href can appear twice (Analytics/Settings -> /profile); only mark the first.
  const seen = new Set<string>();

  return (
    <div className="flex h-full flex-col">
      {/* App icon + name */}
      <div className={cn("flex h-16 shrink-0 items-center gap-3 px-4", collapsed && "justify-center px-0")}>
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3 focus-visible:outline-2 outline-theme-accent rounded-lg">
          <NextImage src="/rainbow.svg" alt="Regenbogenbande" width={32} height={32} />
          {!collapsed && (
            <span className="text-base font-semibold tracking-tight text-foreground">Regenbogenbande</span>
          )}
        </Link>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close menu" className="ml-auto rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Sections */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2 custom-scrollbar">
        {SECTIONS.map((section) => {
          const items = section.items.filter((i) => !i.roles || i.roles.includes(role));
          if (items.length === 0) return null;
          return (
            <div key={section.title}>
              {!collapsed ? (
                <h3 className="mb-2 px-3 text-xs font-medium text-faint">{section.title}</h3>
              ) : (
                <div className="mx-3 mb-2 h-px bg-divider" />
              )}
              <ul className="space-y-1">
                {items.map((item) => {
                  const duplicate = seen.has(item.href);
                  seen.add(item.href);
                  const active = !duplicate && isActive(item);
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        title={collapsed ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          "focus-visible:outline-2 outline-theme-accent",
                          collapsed && "justify-center px-0",
                          active
                            ? "bg-muted font-medium text-foreground"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-theme-accent" />
                        )}
                        <Icon size={18} />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Account */}
      <div className="shrink-0 space-y-1 border-t border-border p-3">
        {!collapsed ? (
          <h3 className="px-3 pb-1 text-xs font-medium text-faint">Account</h3>
        ) : null}

        <ThemeToggle collapsed={collapsed} />

        {isPending ? (
          <Skeleton className="h-12 rounded-lg" />
        ) : session?.user && role !== "guest" ? (
          <>
            <Link
              href="/profile"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/60",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? session.user.name : undefined}
            >
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
                  {session.user.name?.[0]?.toUpperCase() || "U"}
                </span>
              )}
              {!collapsed && (
                <span className="flex min-w-0 flex-col items-start gap-0.5">
                  <span className="max-w-full truncate text-sm font-medium text-foreground">{session.user.name}</span>
                  <RolePill role={role} />
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-danger",
                collapsed && "justify-center px-0"
              )}
            >
              <LogOut size={18} />
              {!collapsed && <span>Log out</span>}
            </button>
          </>
        ) : (
          <Link
            href="/login"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90",
              collapsed && "justify-center px-0"
            )}
          >
            <LogIn size={18} />
            {!collapsed && <span>Sign in</span>}
          </Link>
        )}

        {/* Collapse toggle (desktop only) */}
        {!onClose && (
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        )}
      </div>
    </div>
  );
}

export function MainSidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();

  // Close the mobile drawer on route change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border bg-sidebar backdrop-blur-md md:block",
          "transition-[width] duration-300 ease-out",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-border bg-elevated md:hidden"
            >
              <SidebarContent
                collapsed={false}
                onNavigate={() => setMobileOpen(false)}
                onClose={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
