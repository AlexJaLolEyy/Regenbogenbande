"use client"

import { Avatar, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import NextImage from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import cn from "classnames";

const navItems = [
  { label: "Videos", href: "/videos" },
  { label: "Pictures", href: "/pictures" },
  { label: "Quotes", href: "/quotes" },
];

export default function Navigation() {
  const currentPath = usePathname();

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95vw] z-50 rounded-2xl bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-xl flex items-center justify-between px-4 py-2 border border-white/20 dark:border-black/30">
      {/* Logo as Home Link */}
      {/* TODO: swap logo img */}
      <Link href="/" className="flex items-center group focus:outline-none">
        <NextImage src="/rainbow.svg" alt="Regenbogenbande Logo" width={36} height={36} className="transition-transform group-hover:scale-110" />
        <span className="sr-only">Home</span>
      </Link>

      {/* Navigation Island */}
      <div className="relative flex-1 flex justify-center">
        <div className="flex bg-white/40 dark:bg-black/30 backdrop-blur-md rounded-full px-6 py-1 gap-8 shadow-inner border border-white/20 dark:border-black/30 min-w-[280px] max-w-[420px] w-full justify-center">
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

      {/* Avatar Dropdown */}
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Avatar
            isBordered
            as="button"
            className="transition-transform hover:scale-105 focus:outline-none"
            color="secondary"
            size="sm"
            src="/exampleUserPictures/Alex.jpg"
            radius="full"
          />
        </DropdownTrigger>
        <DropdownMenu aria-label="Profile Actions" variant="flat">
          <DropdownItem key="profile" className="h-14 gap-2">
            <p className="font-semibold">Signed in as</p>
            <p className="font-semibold">test@example.com</p>
          </DropdownItem>
          <DropdownItem key="settings">My Settings</DropdownItem>
          <DropdownItem key="configurations">Configurations</DropdownItem>
          <DropdownItem key="help_and_feedback">Help & Feedback</DropdownItem>
          <DropdownItem key="logout" color="danger">
            Log Out
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </nav>
  );
}