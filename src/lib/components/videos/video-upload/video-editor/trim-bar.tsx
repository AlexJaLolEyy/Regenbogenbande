"use client";

import { formatDuration } from "@/src/lib/utils/format";
import { useCallback, useRef } from "react";
import type { EditorSegment } from "./types";
import { MIN_SEGMENT_DURATION } from "./types";

interface TrimBarProps {
  duration: number;
  segments: EditorSegment[];
  selectedSegmentId: string | null;
  playheadTime: number;
  onSelectSegment: (segmentId: string) => void;
  onUpdateSegment: (segmentId: string, start: number, end: number) => void;
  onSplitAtPlayhead: () => void;
}

type DragHandle = "start" | "end" | "playhead" | null;

export function TrimBar({
  duration,
  segments,
  selectedSegmentId,
  playheadTime,
  onSelectSegment,
  onUpdateSegment,
  onSplitAtPlayhead,
}: TrimBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragHandle>(null);

  const timeToPercent = useCallback(
    (time: number) => (duration > 0 ? (time / duration) * 100 : 0),
    [duration]
  );

  const percentToTime = useCallback(
    (percent: number) => Math.max(0, Math.min(duration, (percent / 100) * duration)),
    [duration]
  );

  const getTimeFromPointer = useCallback(
    (clientX: number) => {
      const bar = barRef.current;
      if (!bar || duration <= 0) return 0;
      const rect = bar.getBoundingClientRect();
      const percent = ((clientX - rect.left) / rect.width) * 100;
      return percentToTime(percent);
    },
    [duration, percentToTime]
  );

  const selectedSegment = segments.find((s) => s.id === selectedSegmentId) ?? null;

  const handlePointerDown = useCallback(
    (handle: DragHandle, segmentId?: string) => (e: React.PointerEvent) => {
      e.preventDefault();
      dragRef.current = handle;
      if (segmentId) onSelectSegment(segmentId);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [onSelectSegment]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current || !selectedSegment) return;

      const time = getTimeFromPointer(e.clientX);

      if (dragRef.current === "start") {
        const newStart = Math.min(time, selectedSegment.end - MIN_SEGMENT_DURATION);
        onUpdateSegment(selectedSegment.id, newStart, selectedSegment.end);
      } else if (dragRef.current === "end") {
        const newEnd = Math.max(time, selectedSegment.start + MIN_SEGMENT_DURATION);
        onUpdateSegment(selectedSegment.id, selectedSegment.start, newEnd);
      }
    },
    [getTimeFromPointer, onUpdateSegment, selectedSegment]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const canSplit =
    selectedSegment &&
    playheadTime > selectedSegment.start + MIN_SEGMENT_DURATION &&
    playheadTime < selectedSegment.end - MIN_SEGMENT_DURATION;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Timeline</span>
        <span className="font-mono text-foreground">
          {formatDuration(playheadTime)} / {formatDuration(duration)}
        </span>
      </div>

      <div
        ref={barRef}
        className="relative h-12 rounded-xl bg-muted border border-border cursor-pointer select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Segment regions */}
        {segments.map((seg) => {
          const isSelected = seg.id === selectedSegmentId;
          const left = timeToPercent(seg.start);
          const width = timeToPercent(seg.end) - left;
          return (
            <button
              key={seg.id}
              type="button"
              className={`absolute top-1 bottom-1 rounded-md transition-colors ${
                isSelected
                  ? "bg-theme-accent/30 border border-theme-accent"
                  : "bg-muted border border-border hover:bg-foreground/10"
              }`}
              style={{ left: `${left}%`, width: `${width}%` }}
              onClick={() => onSelectSegment(seg.id)}
            />
          );
        })}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground z-10 pointer-events-none"
          style={{ left: `${timeToPercent(playheadTime)}%` }}
        />

        {/* In/Out handles for selected segment */}
        {selectedSegment && (
          <>
            <div
              className="absolute top-0 bottom-0 w-3 -ml-1.5 cursor-ew-resize z-20 flex items-center justify-center"
              style={{ left: `${timeToPercent(selectedSegment.start)}%` }}
              onPointerDown={handlePointerDown("start", selectedSegment.id)}
            >
              <div className="w-1 h-8 bg-theme-accent rounded-full" />
            </div>
            <div
              className="absolute top-0 bottom-0 w-3 -ml-1.5 cursor-ew-resize z-20 flex items-center justify-center"
              style={{ left: `${timeToPercent(selectedSegment.end)}%` }}
              onPointerDown={handlePointerDown("end", selectedSegment.id)}
            >
              <div className="w-1 h-8 bg-theme-accent rounded-full" />
            </div>
          </>
        )}
      </div>

      {selectedSegment && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span>In: {formatDuration(selectedSegment.start)}</span>
          <span>Out: {formatDuration(selectedSegment.end)}</span>
          <span>Len: {formatDuration(selectedSegment.end - selectedSegment.start)}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onSplitAtPlayhead}
        disabled={!canSplit}
        className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Split at playhead (cut mid-part)
      </button>
    </div>
  );
}
