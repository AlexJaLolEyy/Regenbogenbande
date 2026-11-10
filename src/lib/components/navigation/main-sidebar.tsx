"use client";

import { useSession } from "@/src/lib/auth-client";
import { DURATION, EASE } from "@/src/lib/motion";
import { cn } from "@/src/lib/utils";
import { Skeleton, Tooltip } from "@heroui/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogIn, Moon, PanelLeftClose, PanelLeftOpen, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import NextImage from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getEffectiveRole } from "../../auth-utils-shared";
import { UserAvatar } from "../ui/user-avatar";
import { isNavActive, NAV_SECTIONS, visibleItems } from "./nav-config";
import { RolePill } from "./role-pill";
import { useSidebar } from "./sidebar-context";
import { UserMenu } from "./user-menu";

/** Label that fades in/out instead of popping when the sidebar collapses. */
function FadeLabel({ show, children, className }: { show: boolean; children: React.ReactNode; className?: string }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.fast }}
          className={cn("overflow-hidden whitespace-nowrap", className)}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function CollapsedTooltip({ label, enabled, children }: { label: string; enabled: boolean; children: React.ReactElement }) {
  return (
    <Tooltip content={label} placement="right" isDisabled={!enabled} delay={200} closeDelay={0} showArrow>
      {children}
    </Tooltip>
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
  const label = isDark ? "Light mode" : "Dark mode";

  return (
    <CollapsedTooltip label={label} enabled={collapsed}>
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={label}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-2 outline-theme-accent",
          collapsed && "justify-center px-0"
        )}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
        <FadeLabel show={!collapsed}>{label}</FadeLabel>
      </button>
    </CollapsedTooltip>
  );
}

function SidebarContent({
  collapsed,
  indicatorId,
  onNavigate,
  onClose,
}: {
  collapsed: boolean;
  /** Distinct layoutId per sidebar instance so desktop and drawer don't share an indicator. */
  indicatorId: string;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { data: session, isPending } = useSession();
  const role = getEffectiveRole(session);
  const { toggleCollapsed } = useSidebar();

  return (
    <div className="flex h-full flex-col">
      {/* Logo + collapse toggle */}
      <div className={cn("flex h-16 shrink-0 items-center gap-2 px-4", collapsed && "flex-col justify-center gap-1 px-0")}>
        <Link href="/" onClick={onNavigate} className="flex min-w-0 items-center gap-3 rounded-lg outline-theme-accent focus-visible:outline-2">
          <NextImage src="/rainbow.svg" alt="Regenbogenbande" width={32} height={32} className="shrink-0" />
          <FadeLabel show={!collapsed} className="text-base font-semibold tracking-tight text-foreground">
            Regenbogenbande
          </FadeLabel>
        </Link>
        {onClose ? (
          <button type="button" onClick={onClose} aria-label="Close menu" className="ml-auto rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X size={18} />
          </button>
        ) : (
          <CollapsedTooltip label="Expand sidebar ([)" enabled={collapsed}>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-keyshortcuts="["
              title={collapsed ? undefined : "Collapse sidebar ([)"}
              className={cn(
                "hidden rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 outline-theme-accent md:block",
                !collapsed && "ml-auto"
              )}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </CollapsedTooltip>
        )}
      </div>

      {/* Sections */}
      <nav className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {NAV_SECTIONS.map((section) => {
          const items = visibleItems(section, role);
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
                  const active = isNavActive(item, pathname);
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <CollapsedTooltip label={item.label} enabled={collapsed}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                            "outline-theme-accent focus-visible:outline-2",
                            collapsed && "justify-center px-0",
                            active ? "font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                          )}
                        >
                          {active && (
                            <motion.span
                              layoutId={indicatorId}
                              transition={reduce ? { duration: 0 } : { type: "spring", damping: 30, stiffness: 400 }}
                              className="absolute inset-0 rounded-lg bg-muted"
                            >
                              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-theme-accent" />
                            </motion.span>
                          )}
                          <Icon
                            size={18}
                            className={cn(
                              "relative shrink-0 transition-transform duration-150 group-hover:translate-x-px",
                              active && "text-theme-accent"
                            )}
                          />
                          <FadeLabel show={!collapsed} className="relative">
                            {item.label}
                          </FadeLabel>
                        </Link>
                      </CollapsedTooltip>
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
        <ThemeToggle collapsed={collapsed} />

        {isPending ? (
          <Skeleton className="h-12 rounded-lg" />
        ) : session?.user && role !== "guest" ? (
          <UserMenu placement="top-start">
            <button
              type="button"
              aria-label="Open account menu"
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-2 outline-theme-accent",
                collapsed && "justify-center px-0"
              )}
            >
              <UserAvatar
                src={session.user.image || undefined}
                name={session.user.name?.[0]?.toUpperCase() || "U"}
                className="h-8 w-8 shrink-0"
              />
              {!collapsed && (
                <span className="flex min-w-0 flex-col items-start gap-0.5">
                  <span className="max-w-full truncate text-sm font-medium text-foreground">{session.user.name}</span>
                  <RolePill role={role} />
                </span>
              )}
            </button>
          </UserMenu>
        ) : (
          <CollapsedTooltip label="Sign in" enabled={collapsed}>
            <Link
              href="/login"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90",
                collapsed && "justify-center px-0"
              )}
            >
              <LogIn size={18} />
              <FadeLabel show={!collapsed}>Sign in</FadeLabel>
            </Link>
          </CollapsedTooltip>
        )}
      </div>
    </div>
  );
}

export function MainSidebar() {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();

  // Close the mobile drawer on route change.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // "[" toggles the sidebar (ignored while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "[" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      toggleCollapsed();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

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
        <SidebarContent collapsed={collapsed} indicatorId="nav-active" />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.base, ease: EASE }}
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
                indicatorId="nav-active-mobile"
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
