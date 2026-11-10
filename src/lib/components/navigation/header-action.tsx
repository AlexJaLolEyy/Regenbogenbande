"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export const HEADER_ACTION_ID = "app-header-action";

/**
 * Renders its children into the right side of the app header (next to the
 * breadcrumbs). Pages use it for their primary action, e.g. "Upload".
 */
export function HeaderAction({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTarget(document.getElementById(HEADER_ACTION_ID));
  }, []);
  return target ? createPortal(children, target) : null;
}
