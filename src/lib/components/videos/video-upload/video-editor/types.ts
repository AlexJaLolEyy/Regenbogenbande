export interface VideoClip {
  key: string;
  file: File;
  url: string;
  duration: number;
  name: string;
}

export interface EditorSegment {
  id: string;
  clipKey: string;
  start: number;
  end: number;
}

export interface VideoJobSpec {
  segments: { key: string; start: number; end: number }[];
  order: string[];
}

export interface VideoEditorResult {
  clips: VideoClip[];
  segments: EditorSegment[];
  spec: VideoJobSpec;
}

export const MAX_CLIPS = 3;
export const MIN_SEGMENT_DURATION = 0.1;
