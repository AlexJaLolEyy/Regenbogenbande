import type { AccentId } from "./hooks/use-accent";

/** Accent palettes themselves live in globals.css ([data-accent]). */
export const ACCENT_OPTIONS: { id: AccentId; label: string }[] = [
    { id: "neutral", label: "Default" },
    { id: "ocean", label: "Ocean" },
    { id: "forest", label: "Forest" },
    { id: "teal", label: "Teal" },
    { id: "wine", label: "Wine" },
    { id: "pink", label: "Dusty pink" },
    { id: "violet", label: "Violet" },
];
