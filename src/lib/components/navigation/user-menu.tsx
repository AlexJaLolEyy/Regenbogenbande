"use client";

import { signOut, useSession } from "@/src/lib/auth-client";
import { getEffectiveRole } from "@/src/lib/auth-utils-shared";
import { ACCENT_OPTIONS } from "@/src/lib/accents";
import { useAccent } from "@/src/lib/hooks/use-accent";
import { cn } from "@/src/lib/utils";
import { Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger, Skeleton } from "@heroui/react";
import { Check, LogIn, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserAvatar } from "../ui/user-avatar";
import { NAV_SECTIONS, visibleItems } from "./nav-config";
import { RolePill } from "./role-pill";

const THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

function AppearanceRow() {
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccent();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col gap-3 px-1 py-1.5" onKeyDown={(e) => e.stopPropagation()}>
      <div role="group" aria-label="Theme" className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted p-0.5">
        {THEMES.map(({ id, label, icon: Icon }) => {
          const active = mounted && theme === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              title={label}
              onClick={() => setTheme(id)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs transition-colors",
                active ? "bg-elevated font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          );
        })}
      </div>
      <div role="group" aria-label="Accent color" className="flex items-center justify-between px-1">
        {ACCENT_OPTIONS.map((a) => {
          const active = mounted && accent === a.id;
          return (
            <button
              key={a.id}
              type="button"
              data-swatch={a.id}
              title={a.label}
              aria-label={a.label}
              aria-pressed={active}
              onClick={() => setAccent(a.id)}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-white outline-offset-2 transition-transform hover:scale-110",
                active && "ring-2 ring-foreground/60 ring-offset-2 ring-offset-popover"
              )}
            >
              {active && <Check size={11} className={a.id === "neutral" ? "text-background" : ""} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function UserMenu({
  children,
  placement = "bottom-end",
  className,
}: {
  /** Custom trigger (e.g. the sidebar account cell). Defaults to the avatar. */
  children?: React.ReactNode;
  placement?: "bottom-end" | "top-start" | "top-end" | "bottom-start";
  className?: string;
}) {
  const { data: session, isPending } = useSession();
  const role = getEffectiveRole(session);
  const router = useRouter();

  if (isPending) return <Skeleton className="h-9 w-9 rounded-full" />;

  if (!session?.user || role === "guest") {
    return (
      <Link
        href="/login"
        className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-theme-accent"
      >
        <LogIn size={16} />
        Sign in
      </Link>
    );
  }

  const user = session.user;
  const isAdmin = role === "owner" || role === "admin";
  const profile = NAV_SECTIONS.flatMap((s) => visibleItems(s, role)).filter((i) =>
    ["/profile", "/analytics"].includes(i.href)
  );
  const adminItems = (NAV_SECTIONS.find((s) => s.title === "Manage")?.items ?? []).filter(
    (i) => i.href.startsWith("/admin") && (!i.roles || i.roles.includes(role))
  );

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

  const sections = [
    <DropdownSection key="head" showDivider>
      <DropdownItem key="header" isReadOnly className="cursor-default opacity-100 data-[hover=true]:bg-transparent">
        <div className="flex flex-col items-start gap-1 py-0.5">
          <span className="max-w-48 truncate text-sm font-medium text-foreground">{user.name}</span>
          <RolePill role={role} />
        </div>
      </DropdownItem>
    </DropdownSection>,
    <DropdownSection key="profile" showDivider>
      {profile.map((item) => (
        <DropdownItem key={item.href} href={item.href} startContent={<item.icon size={16} />}>
          {item.href === "/profile" ? "Profile and settings" : item.label}
        </DropdownItem>
      ))}
    </DropdownSection>,
    ...(isAdmin
      ? [
          <DropdownSection key="admin" title="Admin" showDivider>
            {adminItems.map((item) => (
              <DropdownItem key={item.href} href={item.href} startContent={<item.icon size={16} />}>
                {item.label}
              </DropdownItem>
            ))}
          </DropdownSection>,
        ]
      : []),
    <DropdownSection key="appearance" showDivider>
      <DropdownItem key="appearance-row" isReadOnly closeOnSelect={false} className="cursor-default data-[hover=true]:bg-transparent">
        <AppearanceRow />
      </DropdownItem>
    </DropdownSection>,
    <DropdownSection key="signout">
      <DropdownItem key="logout" color="danger" className="text-danger" startContent={<LogOut size={16} />} onPress={handleLogout}>
        Sign out
      </DropdownItem>
    </DropdownSection>,
  ];

  return (
    <Dropdown placement={placement} classNames={{ content: "min-w-60 bg-popover border border-border" }}>
      <DropdownTrigger>
        {children ?? (
          <button
            type="button"
            aria-label="Open user menu"
            className={cn("rounded-full outline-offset-2 focus-visible:outline-2 focus-visible:outline-theme-accent", className)}
          >
            <UserAvatar src={user.image || undefined} name={user.name?.[0]?.toUpperCase() || "U"} className="h-9 w-9" />
          </button>
        )}
      </DropdownTrigger>
      <DropdownMenu aria-label="User menu" disabledKeys={["header"]}>{sections}</DropdownMenu>
    </Dropdown>
  );
}
