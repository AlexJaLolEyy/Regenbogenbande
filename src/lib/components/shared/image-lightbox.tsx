"use client";

import React from 'react';
import { Modal, ModalContent, Button } from "@heroui/react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faDownload } from '@fortawesome/free-solid-svg-icons';
import NextImage from 'next/image';

interface ImageLightboxProps {
  imageUrl: string;
  title: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const ImageLightbox = ({ imageUrl, title, isOpen, onOpenChange }: ImageLightboxProps) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
      // Fallback: open in new tab
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      size="full"
      classNames={{
        base: "bg-black/90 backdrop-blur-2xl",
        closeButton: "hidden", // We use our own close button
      }}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: 20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        }
      }}
    >
      <ModalContent>
        {(onClose) => (
          <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12">
            {/* Toolbar */}
            <div className="absolute top-6 right-6 flex gap-4 z-50">
              <Button
                isIconOnly
                variant="flat"
                className="bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/10"
                onClick={handleDownload}
                title="Download Image"
              >
                <FontAwesomeIcon icon={faDownload} />
              </Button>
              <Button
                isIconOnly
                variant="flat"
                className="bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/10"
                onClick={onClose}
                title="Close"
              >
                <FontAwesomeIcon icon={faTimes} />
              </Button>
            </div>

            {/* Title Badge (Mobile) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white/80 text-sm max-w-[80vw] truncate">
              {title}
            </div>

            {/* Main Image */}
            <div className="w-full h-full flex items-center justify-center relative">
              <NextImage 
                src={imageUrl} 
                className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-300"
                alt={title}
                fill
                priority
              />
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
};
