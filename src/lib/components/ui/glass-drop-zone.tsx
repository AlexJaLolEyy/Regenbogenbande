"use client";

import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp, faFileVideo } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/src/lib/utils";

import { IconDefinition } from "@fortawesome/free-solid-svg-icons";

interface GlassDropZoneProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    className?: string;
    title?: string;
    subtitle?: string;
    icon?: IconDefinition;
}

export function GlassDropZone({
    onFileSelect,
    accept = "video/*",
    className,
    title,
    subtitle,
    icon
}: GlassDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            handleFile(file);
        }
    };

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
            e.target.value = "";
        }
    };

    const handleFile = (file: File) => {
        setSelectedFileName(file.name);
        onFileSelect(file);
    };

    return (
        <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-colors duration-200 min-h-50 flex flex-col items-center justify-center gap-4 text-center p-6",
                isDragging
                    ? "border-theme-accent bg-muted"
                    : "border-border bg-muted/40 hover:bg-muted hover:border-foreground/30",
                className
            )}
        >
            <input
                type="file"
                ref={inputRef}
                onChange={handleFileChange}
                accept={accept}
                className="hidden"
            />

            <div className="w-16 h-16 rounded-full flex items-center justify-center border border-border bg-card text-muted-foreground transition-transform duration-300 group-hover:scale-105">
                <FontAwesomeIcon
                    icon={selectedFileName ? (icon ?? faFileVideo) : (icon ?? faCloudArrowUp)}
                    className="text-2xl"
                />
            </div>

            <div className="space-y-1">
                {selectedFileName ? (
                    <>
                        <p className="text-lg font-semibold text-foreground">File selected</p>
                        <p className="text-sm text-muted-foreground font-medium truncate max-w-75">{selectedFileName}</p>
                        <p className="text-xs text-faint mt-2">Click to replace</p>
                    </>
                ) : (
                    <>
                        <p className="text-lg font-semibold text-foreground">{title ?? "Upload file"}</p>
                        <p className="text-sm text-muted-foreground">Drag & drop or click to browse</p>
                        {subtitle && <p className="text-xs text-faint mt-4">{subtitle}</p>}
                    </>
                )}
            </div>
        </div>
    );
}