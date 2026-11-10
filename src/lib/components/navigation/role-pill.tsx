import type { EffectiveRole } from "../../auth-utils-shared";
import { ROLE_META } from "./nav-config";

export function RolePill({ role }: { role: EffectiveRole }) {
  const { label, icon: Icon } = ROLE_META[role];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      <Icon size={11} />
      {label}
    </span>
  );
}
