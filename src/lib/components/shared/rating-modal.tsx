"use client";

import { getUserRating, rateMedia } from '@/src/lib/actions/ratings';
import { cn } from '@/src/lib/utils';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

interface RatingModalProps {
  contentType: 'video' | 'picture' | 'quote';
  contentId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const RatingModal = ({ contentType, contentId, isOpen, onOpenChange }: RatingModalProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getUserRating(contentType, contentId).then(val => {
        if (val) setRating(val);
      });
    }
  }, [isOpen, contentType, contentId]);

  const handleRate = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await rateMedia(contentType, contentId, rating);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to rate:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      backdrop="blur"
      classNames={{
        base: "bg-elevated border border-border",
        header: "border-b border-divider",
        footer: "border-t border-divider",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-foreground">Rate this {contentType}</ModalHeader>
            <ModalBody className="py-8">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoveredRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110 focus-visible:outline-2 outline-theme-accent rounded"
                    >
                      <Star
                        size={36}
                        fill={active ? "currentColor" : "none"}
                        className={cn(active ? "text-gold" : "text-faint")}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                {rating > 0 ? `You selected ${rating} star${rating > 1 ? 's' : ''}` : "Select your rating"}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                className="font-medium"
                onPress={handleRate}
                isLoading={isSubmitting}
                isDisabled={rating === 0}
              >
                Submit rating
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
