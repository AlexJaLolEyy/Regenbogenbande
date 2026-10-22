"use client";

import { useCallback, useSyncExternalStore } from "react";

export type AccentId = "neutral" | "ocean" | "forest" | "teal" | "wine" | "pink" | "violet";

export const ACCENT_STORAGE_KEY = "accent";

const listeners = new Set<() => void>();

function read(): AccentId {
    if (typeof window === "undefined") return "neutral";
    return (localStorage.getItem(ACCENT_STORAGE_KEY) as AccentId) || "neutral";
}

function subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
}

/** Selected accent theme, persisted in localStorage and applied as <html data-accent>. */
export function useAccent() {
    const accent = useSyncExternalStore(subscribe, read, () => "neutral" as AccentId);

    const setAccent = useCallback((next: AccentId) => {
        if (next === "neutral") {
            localStorage.removeItem(ACCENT_STORAGE_KEY);
            document.documentElement.removeAttribute("data-accent");
        } else {
            localStorage.setItem(ACCENT_STORAGE_KEY, next);
            document.documentElement.setAttribute("data-accent", next);
        }
        listeners.forEach((l) => l());
    }, []);

    return { accent, setAccent };
}
