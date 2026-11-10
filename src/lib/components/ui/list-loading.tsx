import { CardSkeleton, LIST_GRID, LIST_MASONRY, ListPanel } from "./media-card";
import { PageShell } from "./page-shell";

/** Route-level loading skeleton shared by the video, picture and quote lists. */
export function ListLoading({ title, masonry = false, count = 12 }: { title: string; masonry?: boolean; count?: number }) {
  return (
    <PageShell>
      <div className="flex h-[calc(100vh-3rem)] w-full flex-col gap-4 px-4 pb-4 pt-4 lg:px-6 lg:pb-6">
        <div className="h-14 shrink-0 rounded-2xl border border-border bg-card/40" />
        <ListPanel title={title}>
          <div className={masonry ? LIST_MASONRY : LIST_GRID}>
            {Array.from({ length: count }).map((_, i) => (
              <CardSkeleton
                key={i}
                className={masonry ? "mb-6 break-inside-avoid" : undefined}
                media={masonry ? (i % 2 ? "h-40" : "h-28") : "aspect-video"}
              />
            ))}
          </div>
        </ListPanel>
      </div>
    </PageShell>
  );
}
