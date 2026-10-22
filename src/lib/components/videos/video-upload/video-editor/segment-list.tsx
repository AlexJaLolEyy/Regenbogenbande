"use client";

import { formatDuration } from "@/src/lib/utils/format";
import { faGripVertical, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Reorder } from "framer-motion";
import type { EditorSegment, VideoClip } from "./types";

interface SegmentListProps {
  segments: EditorSegment[];
  clips: VideoClip[];
  selectedSegmentId: string | null;
  onReorder: (segments: EditorSegment[]) => void;
  onSelect: (segmentId: string) => void;
  onRemove: (segmentId: string) => void;
}

export function SegmentList({
  segments,
  clips,
  selectedSegmentId,
  onReorder,
  onSelect,
  onRemove,
}: SegmentListProps) {
  const getClipName = (clipKey: string) =>
    clips.find((c) => c.key === clipKey)?.name ?? clipKey;

  if (segments.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        No segments yet. Add clips and trim to build your sequence.
      </p>
    );
  }

  return (
    <Reorder.Group
      axis="y"
      values={segments}
      onReorder={onReorder}
      className="space-y-2"
    >
      {segments.map((seg, index) => (
        <Reorder.Item
          key={seg.id}
          value={seg}
          className={`flex items-center gap-3 p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-colors ${
            seg.id === selectedSegmentId
              ? "bg-muted border-theme-accent"
              : "bg-muted border-border hover:bg-foreground/10"
          }`}
          onClick={() => onSelect(seg.id)}
        >
          <FontAwesomeIcon
            icon={faGripVertical}
            className="text-faint text-xs shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-faint">
                #{index + 1}
              </span>
              <span className="text-sm text-foreground font-medium truncate">
                {getClipName(seg.clipKey)}
              </span>
            </div>
            <span className="text-xs text-foreground/70 font-mono">
              {formatDuration(seg.start)} → {formatDuration(seg.end)}
              {" "}
              ({formatDuration(seg.end - seg.start)})
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(seg.id);
            }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
            aria-label="Remove segment"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
