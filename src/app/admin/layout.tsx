/**
 * Shared chrome for all admin pages: calm tokened background and a content
 * container. Authorization is still enforced in each server action.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-3rem)] w-full overflow-x-hidden bg-background text-foreground">
      <div className="container mx-auto max-w-350 p-6 pt-8">{children}</div>
    </div>
  );
}
