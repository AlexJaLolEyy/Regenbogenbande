"use client";

import { formatDuration } from "@/src/lib/utils/format";
import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Tab, Tabs } from "@heroui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GlassDropZone } from "../../../ui/glass-drop-zone";
import { buildJobSpec } from "./build-job-spec";
import { SegmentList } from "./segment-list";
import { TrimBar } from "./trim-bar";
import type { EditorSegment, VideoClip, VideoEditorResult } from "./types";
import { MAX_CLIPS, MIN_SEGMENT_DURATION } from "./types";
import { useSegmentPlayer } from "./use-segment-player";

interface VideoEditorProps {
  initialClips: VideoClip[];
  initialSegments: EditorSegment[];
  onSave: (result: VideoEditorResult) => void;
  onCancel: () => void;
}

async function loadClipFromFile(file: File, key: string): Promise<VideoClip> {
  const url = URL.createObjectURL(file);
  const duration = await new Promise<number>((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => resolve(video.duration);
    video.onerror = () => reject(new Error("Failed to load video metadata"));
    video.src = url;
  });
  return { key, file, url, duration, name: file.name };
}

function createSegment(clipKey: string, start: number, end: number): EditorSegment {
  return {
    id: crypto.randomUUID(),
    clipKey,
    start,
    end,
  };
}

export function VideoEditor({
  initialClips,
  initialSegments,
  onSave,
  onCancel,
}: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [clips, setClips] = useState<VideoClip[]>(initialClips);
  const [segments, setSegments] = useState<EditorSegment[]>(initialSegments);
  const [activeClipKey, setActiveClipKey] = useState(initialClips[0]?.key ?? "");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    initialSegments[0]?.id ?? null
  );

  const clipUrls = useMemo(
    () => Object.fromEntries(clips.map((c) => [c.key, c.url])),
    [clips]
  );

  const activeClip = clips.find((c) => c.key === activeClipKey) ?? clips[0];
  const activeClipSegments = segments.filter((s) => s.clipKey === activeClipKey);

  const {
    isPlaying,
    currentSegmentIndex,
    playheadTime,
    togglePlay,
    seekToSegment,
    setPlayheadTime,
  } = useSegmentPlayer(videoRef, { segments, clipUrls });

  // Auto-select a segment when switching active clip
  useEffect(() => {
    const selectedInActive = activeClipSegments.some((s) => s.id === selectedSegmentId);
    if (!selectedInActive && activeClipSegments.length > 0) {
      setSelectedSegmentId(activeClipSegments[0].id);
    }
  }, [activeClipKey, activeClipSegments, selectedSegmentId]);

  // Sync active clip when playback moves to a segment from another clip
  useEffect(() => {
    const seg = segments[currentSegmentIndex];
    if (seg && seg.clipKey !== activeClipKey) {
      setActiveClipKey(seg.clipKey);
      setSelectedSegmentId(seg.id);
    }
  }, [currentSegmentIndex, segments, activeClipKey]);

  const handleUpdateSegment = useCallback(
    (segmentId: string, start: number, end: number) => {
      setSegments((prev) =>
        prev.map((s) => (s.id === segmentId ? { ...s, start, end } : s))
      );
      const video = videoRef.current;
      if (video && selectedSegmentId === segmentId) {
        video.currentTime = start;
        setPlayheadTime(start);
      }
    },
    [selectedSegmentId, setPlayheadTime]
  );

  const handleSplitAtPlayhead = useCallback(() => {
    if (!selectedSegmentId) return;
    const seg = segments.find((s) => s.id === selectedSegmentId);
    if (!seg) return;

    if (
      playheadTime <= seg.start + MIN_SEGMENT_DURATION ||
      playheadTime >= seg.end - MIN_SEGMENT_DURATION
    ) {
      return;
    }

    const first: EditorSegment = {
      ...seg,
      id: crypto.randomUUID(),
      end: playheadTime,
    };
    const second: EditorSegment = {
      ...seg,
      id: crypto.randomUUID(),
      start: playheadTime,
    };

    setSegments((prev) => {
      const idx = prev.findIndex((s) => s.id === seg.id);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1, first, second);
      return next;
    });
    setSelectedSegmentId(first.id);
  }, [playheadTime, segments, selectedSegmentId]);

  const handleRemoveSegment = useCallback(
    (segmentId: string) => {
      if (segments.length <= 1) return;
      setSegments((prev) => prev.filter((s) => s.id !== segmentId));
      if (selectedSegmentId === segmentId) {
        const remaining = segments.filter((s) => s.id !== segmentId);
        setSelectedSegmentId(remaining[0]?.id ?? null);
      }
    },
    [segments, selectedSegmentId]
  );

  const handleAddClip = useCallback(async (file: File) => {
    if (clips.length >= MAX_CLIPS) return;
    const key = `clip-${clips.length + 1}`;
    const clip = await loadClipFromFile(file, key);
    const segment = createSegment(key, 0, clip.duration);
    setClips((prev) => [...prev, clip]);
    setSegments((prev) => [...prev, segment]);
    setActiveClipKey(key);
    setSelectedSegmentId(segment.id);
  }, [clips.length]);

  const handleSelectSegment = useCallback(
    (segmentId: string) => {
      setSelectedSegmentId(segmentId);
      const seg = segments.find((s) => s.id === segmentId);
      if (!seg) return;
      setActiveClipKey(seg.clipKey);
      const index = segments.findIndex((s) => s.id === segmentId);
      void seekToSegment(index, seg.start);
    },
    [segments, seekToSegment]
  );

  const handleSave = useCallback(() => {
    onSave({
      clips,
      segments,
      spec: buildJobSpec(segments),
    });
  }, [clips, onSave, segments]);

  const totalDuration = segments.reduce((sum, s) => sum + (s.end - s.start), 0);

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Preview */}
      <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-border relative">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onClick={togglePlay}
        />
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
        >
          <div className="w-14 h-12 rounded-full bg-black/60 border border-border flex items-center justify-center text-foreground">
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
          </div>
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Output: {segments.length} segment{segments.length !== 1 ? "s" : ""}
        </span>
        <span className="font-mono text-foreground">
          Total: {formatDuration(totalDuration)}
        </span>
      </div>

      {/* Clip tabs */}
      {clips.length > 1 && (
        <Tabs
          selectedKey={activeClipKey}
          onSelectionChange={(key) => setActiveClipKey(key as string)}
          variant="bordered"
          size="sm"
          classNames={{
            tabList: "bg-muted border border-border",
            tabContent: "text-muted-foreground group-data-[selected=true]:text-foreground",
            cursor: "bg-primary",
          }}
        >
          {clips.map((clip) => (
            <Tab key={clip.key} title={clip.name.length > 20 ? `${clip.name.slice(0, 17)}...` : clip.name} />
          ))}
        </Tabs>
      )}

      {/* Trim bar for active clip */}
      {activeClip && (
        <TrimBar
          duration={activeClip.duration}
          segments={activeClipSegments}
          selectedSegmentId={selectedSegmentId}
          playheadTime={playheadTime}
          onSelectSegment={handleSelectSegment}
          onUpdateSegment={handleUpdateSegment}
          onSplitAtPlayhead={handleSplitAtPlayhead}
        />
      )}

      {/* Segment list */}
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-muted-foreground">Sequence (drag to reorder)</h4>
        <SegmentList
          segments={segments}
          clips={clips}
          selectedSegmentId={selectedSegmentId}
          onReorder={setSegments}
          onSelect={handleSelectSegment}
          onRemove={handleRemoveSegment}
        />
      </div>

      {/* Add clip */}
      {clips.length < MAX_CLIPS && (
        <div className="border border-dashed border-border rounded-2xl p-2">
          <GlassDropZone
            onFileSelect={(file) => void handleAddClip(file)}
            title={`Add Clip (${clips.length}/${MAX_CLIPS})`}
            subtitle="Merge up to 3 clips"
            className="min-h-24 border-none bg-transparent"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-border">
        <Button
          className="flex-1 bg-primary text-primary-foreground font-medium"
          onPress={handleSave}
        >
          Save Edits
        </Button>
        <Button variant="bordered" className="border-border text-foreground" onPress={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
