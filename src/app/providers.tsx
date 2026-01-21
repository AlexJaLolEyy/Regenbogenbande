"use client";

import { HeroUIProvider } from "@heroui/react";
import { QueryProvider } from "../lib/components/providers/query-client-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <HeroUIProvider>
        {children}
      </HeroUIProvider>
    </QueryProvider>
  )
}
