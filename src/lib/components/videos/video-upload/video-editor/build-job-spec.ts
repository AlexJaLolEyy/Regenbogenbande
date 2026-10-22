import type { EditorSegment, VideoJobSpec } from "./types";

export function buildJobSpec(segments: EditorSegment[]): VideoJobSpec {
  return {
    segments: segments.map((seg) => ({
      key: seg.clipKey,
      start: seg.start,
      end: seg.end,
    })),
    order: segments.map((seg) => seg.id),
  };
}
