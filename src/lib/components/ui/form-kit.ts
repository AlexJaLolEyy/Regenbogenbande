/**
 * Shared form styling for upload and edit forms (HeroUI `classNames`).
 * One field height (h-12), token colors, accent focus ring.
 */
const focus = "focus-within:border-theme-accent! data-[focus=true]:border-theme-accent!";

export const FIELD_INPUT = {
    inputWrapper: `bg-muted border-border h-12 hover:border-foreground/30 transition-colors ${focus}`,
    input: "text-foreground placeholder:text-faint",
    label: "text-sm font-medium text-muted-foreground",
};

export const FIELD_TEXTAREA = {
    inputWrapper: `bg-muted border-border hover:border-foreground/30 transition-colors ${focus}`,
    input: "text-foreground leading-relaxed placeholder:text-faint",
    label: "text-sm font-medium text-muted-foreground",
};

export const FIELD_SELECT = {
    trigger: `bg-muted border-border min-h-12 hover:border-foreground/30 transition-colors ${focus}`,
    label: "text-sm font-medium text-muted-foreground",
    value: "text-foreground",
};

/** Large card that wraps a form column. */
export const FORM_CARD =
    "rounded-2xl border border-border bg-card/70 p-6 shadow-sm backdrop-blur-md lg:p-8";

/** Modal surface for crop/preview/confirm dialogs. */
export const MODAL_CLASSNAMES = {
    base: "bg-elevated border border-border",
    header: "border-b border-divider",
    footer: "border-t border-divider",
};

export const PRIMARY_CTA = "flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90";
export const SECONDARY_CTA = "h-12 rounded-xl border-border px-8 font-medium text-foreground hover:bg-muted";

export const PROGRESS_CLASSNAMES = {
    base: "h-1.5",
    indicator: "bg-theme-accent",
    track: "bg-muted",
};
