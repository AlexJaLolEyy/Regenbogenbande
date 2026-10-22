"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EditorSegment } from "./types";

interface UseSegmentPlayerOptions {
  segments: EditorSegment[];
  clipUrls: Record<string, string>;
  onPlayheadChange?: (segmentIndex: number, timeInClip: number) => void;
}

export function useSegmentPlayer(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  { segments, clipUrls, onPlayheadChange }: UseSegmentPlayerOptions
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [playheadTime, setPlayheadTime] = useState(0);
  const segmentIndexRef = useRef(0);
  const isTransitioningRef = useRef(false);

  const getSegment = useCallback(
    (index: number) => segments[index] ?? null,
    [segments]
  );

  const seekToSegment = useCallback(
    async (index: number, timeInSegment?: number) => {
      const video = videoRef.current;
      const segment = getSegment(index);
      if (!video || !segment) return;

      segmentIndexRef.current = index;
      setCurrentSegmentIndex(index);

      const clipUrl = clipUrls[segment.clipKey];
      if (!clipUrl) return;

      const targetTime = timeInSegment ?? segment.start;
      const clampedTime = Math.max(segment.start, Math.min(targetTime, segment.end));

      isTransitioningRef.current = true;

      const needsSrcChange = video.getAttribute("data-clip-url") !== clipUrl;
      if (needsSrcChange) {
        video.src = clipUrl;
        video.setAttribute("data-clip-url", clipUrl);
        await new Promise<void>((resolve) => {
          const onLoaded = () => {
            video.removeEventListener("loadedmetadata", onLoaded);
            resolve();
          };
          video.addEventListener("loadedmetadata", onLoaded);
        });
      }

      video.currentTime = clampedTime;
      setPlayheadTime(clampedTime);
      onPlayheadChange?.(index, clampedTime);
      isTransitioningRef.current = false;
    },
    [clipUrls, getSegment, onPlayheadChange, videoRef]
  );

  const play = useCallback(async () => {
    const video = videoRef.current;
    if (!video || segments.length === 0) return;

    await seekToSegment(segmentIndexRef.current, video.currentTime || segments[segmentIndexRef.current]?.start);
    await video.play();
    setIsPlaying(true);
  }, [seekToSegment, segments, videoRef]);

  const pause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
  }, [videoRef]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      void play();
    }
  }, [isPlaying, pause, play]);

  const handleTimeUpdate = useCallback(() => {
    if (isTransitioningRef.current) return;

    const video = videoRef.current;
    const segment = getSegment(segmentIndexRef.current);
    if (!video || !segment) return;

    const currentTime = video.currentTime;
    setPlayheadTime(currentTime);
    onPlayheadChange?.(segmentIndexRef.current, currentTime);

    if (currentTime >= segment.end - 0.05) {
      const nextIndex = segmentIndexRef.current + 1;
      if (nextIndex < segments.length) {
        void seekToSegment(nextIndex);
        if (isPlaying) {
          void video.play();
        }
      } else {
        video.pause();
        setIsPlaying(false);
        video.currentTime = segment.end;
      }
    }
  }, [getSegment, isPlaying, onPlayheadChange, seekToSegment, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [handleTimeUpdate, videoRef]);

  useEffect(() => {
    if (segments.length === 0) return;
    if (segmentIndexRef.current >= segments.length) {
      segmentIndexRef.current = 0;
      setCurrentSegmentIndex(0);
    }
    void seekToSegment(segmentIndexRef.current);
  }, [segments, seekToSegment]);

  return {
    isPlaying,
    currentSegmentIndex,
    playheadTime,
    play,
    pause,
    togglePlay,
    seekToSegment,
    setPlayheadTime,
  };
}
