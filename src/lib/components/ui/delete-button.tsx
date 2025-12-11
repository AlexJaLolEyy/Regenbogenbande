'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure
} from "@heroui/react";
import { deleteVideo, deletePicture, deleteQuote } from '@/src/app/current-storage/storage';

interface DeleteButtonProps {
    id: number;
    type: 'video' | 'picture' | 'quote';
    ownerId: number;
    redirectUrl: string;
}

export function DeleteButton({ id, type, ownerId, redirectUrl }: DeleteButtonProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [isDeleting, setIsDeleting] = useState(false);

    // Check permissions: Admin or Owner
    const isAdmin = (session?.user as any)?.role === 'admin';
    const isOwner = session?.user?.id === String(ownerId);

    if (!isAdmin && !isOwner) {
        return null;
    }

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            if (type === 'video') await deleteVideo(id);
            if (type === 'picture') await deletePicture(id);
            if (type === 'quote') await deleteQuote(id);

            router.push(redirectUrl);
            router.refresh();
            // Modal closes automatically or can be closed here
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete item. Please try again.'); // Keep alert for error fallback
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                onClick={onOpen}
                disabled={isDeleting}
                className="p-2 text-danger hover:bg-danger/10 rounded-full transition-colors disabled:opacity-50"
                title="Delete Item"
            >
                <Trash2 size={20} />
            </button>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Confirm Deletion</ModalHeader>
                            <ModalBody>
                                <p>
                                    Are you sure you want to delete this {type}? This action cannot be undone and will remove all associated files.
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="default" variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button color="danger" onPress={handleDelete} isLoading={isDeleting}>
                                    Delete
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
