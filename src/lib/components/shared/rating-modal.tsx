"use client";

import { getUserRating, rateMedia } from '@/src/lib/actions/ratings';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
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
        base: "bg-[#121212]/90 border border-white/10",
        header: "border-b border-white/5",
        footer: "border-t border-white/5",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-white">Rate this {contentType}</ModalHeader>
            <ModalBody className="py-8">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                    className="text-4xl transition-transform hover:scale-125 focus:outline-none"
                  >
                    <FontAwesomeIcon 
                      icon={(hoveredRating || rating) >= star ? faStarSolid : faStarRegular} 
                      className={(hoveredRating || rating) >= star ? "text-yellow-400" : "text-white/20"}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-white/40 text-sm mt-4">
                {rating > 0 ? `You selected ${rating} star${rating > 1 ? 's' : ''}` : "Select your rating"}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} className="text-white/60">
                Cancel
              </Button>
              <Button 
                className="bg-purple-600 text-white font-bold"
                onPress={handleRate}
                isLoading={isSubmitting}
                isDisabled={rating === 0}
              >
                Submit Rating
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
