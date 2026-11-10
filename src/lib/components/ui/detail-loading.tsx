import { Skeleton } from "@heroui/react";

/** Route-level loading skeleton for detail pages. */
export function DetailLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 lg:px-6">
      <Skeleton className="h-8 w-1/3 rounded-lg" />
      <Skeleton className="aspect-video w-full rounded-2xl" />
      <Skeleton className="h-4 w-2/3 rounded" />
      <Skeleton className="h-4 w-1/2 rounded" />
    </div>
  );
}
