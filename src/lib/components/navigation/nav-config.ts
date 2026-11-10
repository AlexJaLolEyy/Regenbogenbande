import {
  BarChart3,
  Crown,
  Database,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  Quote,
  Settings,
  Shield,
  User,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { EffectiveRole } from "../../auth-utils-shared";

export interface NavEntry {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roles allowed to see this entry. Omitted = everyone. */
  roles?: EffectiveRole[];
  /** Match exactly instead of by prefix. */
  exact?: boolean;
}

export interface NavSection {
  title: string;
  items: NavEntry[];
}

const MEMBERS: EffectiveRole[] = ["owner", "admin", "member"];
const ADMINS: EffectiveRole[] = ["owner", "admin"];

/** Single source of truth for the sidebar and the user menu. */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Browse",
    items: [
      { label: "Overview", href: "/", icon: Home, exact: true },
      { label: "Videos", href: "/videos", icon: Video },
      { label: "Pictures", href: "/pictures", icon: ImageIcon },
      { label: "Quotes", href: "/quotes", icon: Quote },
      { label: "Statistics", href: "/analytics", icon: BarChart3, roles: MEMBERS },
    ],
  },
  {
    title: "Manage",
    items: [
      { label: "Settings", href: "/profile", icon: Settings, roles: MEMBERS },
      { label: "Categories", href: "/admin/categories", icon: LayoutGrid, roles: ADMINS },
      { label: "Users", href: "/admin/users", icon: Users, roles: ADMINS },
      { label: "Publishing", href: "/admin/content", icon: Database, roles: ["owner"] },
    ],
  },
];

export const ROLE_META: Record<EffectiveRole, { label: string; icon: LucideIcon }> = {
  owner: { label: "Owner", icon: Crown },
  admin: { label: "Admin", icon: Shield },
  member: { label: "Member", icon: User },
  guest: { label: "Guest", icon: User },
};

export function visibleItems(section: NavSection, role: EffectiveRole): NavEntry[] {
  return section.items.filter((i) => !i.roles || i.roles.includes(role));
}

export function isNavActive(item: NavEntry, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}
