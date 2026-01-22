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
                "relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 min-h-[200px] flex flex-col items-center justify-center gap-4 text-center p-6",
                isDragging
                    ? "border-primary bg-primary/10 scale-[1.02]"
                    : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40",
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

            <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500",
                selectedFileName ? "bg-success/20 text-success" : "bg-white/10 text-white/70 group-hover:scale-110 group-hover:bg-white/20"
            )}>
                <FontAwesomeIcon
                    icon={selectedFileName ? (icon ?? faFileVideo) : faCloudArrowUp}
                    className="text-2xl"
                />
            </div>

            <div className="space-y-1">
                {selectedFileName ? (
                    <>
                        <p className="text-lg font-semibold text-white">File Selected</p>
                        <p className="text-sm text-success font-medium truncate max-w-[300px]">{selectedFileName}</p>
                        <p className="text-xs text-white/40 mt-2">Click to replace</p>
                    </>
                ) : (
                    <>
                        <p className="text-lg font-semibold text-white">{title ?? "Upload Video"}</p>
                        <p className="text-sm text-white/50">Drag & drop or click to browse</p>
                        <p className="text-xs text-white/30 mt-4">{subtitle ?? "MP4, WebM (Max 500MB)"}</p>
                    </>
                )}
            </div>

            {/* Glow Effect */}
            <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-0 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none" />
        </div>
    );
}
