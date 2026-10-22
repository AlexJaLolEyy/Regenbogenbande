"use client";

import { Button, Slider, Tab, Tabs } from "@heroui/react";
import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImg } from "./get-cropped-img";

interface ImageCropperProps {
  imageFile: File;
  onApply: (croppedFile: File) => void;
  onCancel: () => void;
}

const ASPECT_OPTIONS = [
  { key: "free", label: "Free", value: undefined },
  { key: "1:1", label: "1:1", value: 1 },
  { key: "16:9", label: "16:9", value: 16 / 9 },
  { key: "4:3", label: "4:3", value: 4 / 3 },
] as const;

export function ImageCropper({ imageFile, onApply, onCancel }: ImageCropperProps) {
  const imageSrc = URL.createObjectURL(imageFile);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectKey, setAspectKey] = useState<string>("free");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const aspect =
    ASPECT_OPTIONS.find((o) => o.key === aspectKey)?.value ?? undefined;

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApply = useCallback(async () => {
    if (!croppedAreaPixels) return;
    setIsApplying(true);
    try {
      const croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        imageFile.name,
        imageFile.type || "image/jpeg"
      );
      onApply(croppedFile);
    } finally {
      setIsApplying(false);
    }
  }, [croppedAreaPixels, imageFile.name, imageFile.type, imageSrc, onApply]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full h-80 bg-black rounded-2xl overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-medium">Zoom</label>
        <Slider
          size="sm"
          step={0.1}
          minValue={1}
          maxValue={3}
          value={zoom}
          onChange={(v) => setZoom(v as number)}
          classNames={{
            track: "bg-muted",
            filler: "bg-theme-accent",
            thumb: "bg-theme-accent",
          }}
        />
      </div>

      <Tabs
        selectedKey={aspectKey}
        onSelectionChange={(key) => setAspectKey(key as string)}
        variant="bordered"
        size="sm"
        classNames={{
          tabList: "bg-muted border border-border",
          tabContent: "text-muted-foreground group-data-[selected=true]:text-foreground text-xs",
          cursor: "bg-primary",
        }}
      >
        {ASPECT_OPTIONS.map((opt) => (
          <Tab key={opt.key} title={opt.label} />
        ))}
      </Tabs>

      <div className="flex gap-3 pt-2 border-t border-border">
        <Button
          className="flex-1 bg-primary text-primary-foreground font-medium"
          onPress={() => void handleApply()}
          isLoading={isApplying}
        >
          Apply Crop
        </Button>
        <Button variant="bordered" className="border-border text-foreground" onPress={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
