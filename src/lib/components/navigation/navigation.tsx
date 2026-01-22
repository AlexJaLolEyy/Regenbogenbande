"use client"

import { signOut, useSession } from "@/src/lib/auth-client";
import { Avatar, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Skeleton } from "@heroui/react";
import cn from "classnames";
import { LogIn, LogOut, Settings, Shield } from "lucide-react";
import { motion } from "motion/react";
import NextImage from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getEffectiveRole } from "../../auth-utils-shared";

const navItems = [
  { label: "Videos", href: "/videos" },
  { label: "Pictures", href: "/pictures" },
  { label: "Quotes", href: "/quotes" },
];

export default function Navigation() {
  const currentPath = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const role = getEffectiveRole(session);


  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
          router.refresh();
        }
      }
    });
  };

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95vw] z-50 rounded-2xl bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-xl flex items-center justify-between px-4 py-2 border border-white/20 dark:border-black/30">
      {/* Logo as Home Link */}
      <Link href="/" className="flex items-center group focus:outline-none">
        <NextImage src="/rainbow.svg" alt="Regenbogenbande Logo" width={36} height={36} className="transition-transform group-hover:scale-110" />
        <span className="sr-only">Home</span>
      </Link>

      {/* Navigation Island */}
      <div className="relative flex-1 flex justify-center">
        <div className="flex bg-white/40 dark:bg-black/30 backdrop-blur-md rounded-full px-6 py-1 gap-8 shadow-inner border border-white/20 dark:border-black/30 min-w-70 max-w-105 w-full justify-center">
          {navItems.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative z-10 px-8 py-1.5 rounded-full font-medium text-sm transition-colors",
                  isActive
                    ? "text-black dark:text-white"
                    : "text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
                )}
                tabIndex={0}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 z-0 rounded-full bg-white/80 dark:bg-black/50 shadow-md"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Actions */}
      <div className="min-w-10 flex justify-end">
        {isPending ? (
          <Skeleton className="rounded-full w-8 h-8" />
        ) : session?.user ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform hover:scale-105 focus:outline-none"
                color="secondary"
                size="sm"
                src={session.user.image || undefined}
                name={session.user.name?.[0] || "U"}
                radius="full"
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2 text-opacity-100">
                <p className="font-semibold">Signed in as</p>
                <p className="font-semibold text-primary">{session.user.name}</p>
                {(role === "admin" || role === "owner") && (
                  <span className="text-xs bg-purple-500/20 text-purple-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                    {role === "owner" ? "Owner" : "Admin"}
                  </span>
                )}
              </DropdownItem>

              <DropdownItem key="settings" startContent={<Settings size={16} />} href="/profile">My Settings</DropdownItem>

              {(role === "admin" || role === "owner") ? (
                <DropdownItem
                  key="admin_users"
                  startContent={<Shield size={16} />}
                  onPress={() => router.push("/admin/users")}
                  className="text-purple-600 dark:text-purple-400"
                >
                  Manage Users
                </DropdownItem>
              ) : (
                <DropdownItem className="hidden" key="hidden_admin" />
              )}

              <DropdownItem
                key="logout"
                color="danger"
                startContent={<LogOut size={16} />}
                onPress={handleLogout}
              >
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <Button
            as={Link}
            href="/login"
            size="sm"
            color="primary"
            variant="flat"
            startContent={<LogIn size={16} />}
            className="font-medium"
          >
            Sign In
          </Button>
        )}
      </div>
    </nav>
  );
}
