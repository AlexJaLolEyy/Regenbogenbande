'use client';

import { deletePicture, deleteQuote, deleteVideo } from '@/src/lib/actions/delete-actions';
import { useSession } from '@/src/lib/auth-client';
import {
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    useDisclosure
} from "@heroui/react";
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getEffectiveRole } from '../../auth-utils-shared';
import { queryKeys } from '../../queries/query-keys';

interface DeleteButtonProps {
    id: string;
    type: 'video' | 'picture' | 'quote';
    ownerId: string;
    redirectUrl: string;
}

export function DeleteButton({ id, type, ownerId, redirectUrl }: DeleteButtonProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [isDeleting, setIsDeleting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const role = getEffectiveRole(session);
    const queryClient = useQueryClient();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Check permissions: Admin or Owner
    const isAdmin = role === 'admin';
    const isOwner = session?.user?.id === ownerId;

    if (!mounted) {
        return null;
    }

    if (!isAdmin && !isOwner) {
        return null;
    }

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            if (type === 'video') {
                await deleteVideo(id);
                queryClient.invalidateQueries({ queryKey: queryKeys.videos.all });
            }
            if (type === 'picture') {
                await deletePicture(id);
                queryClient.invalidateQueries({ queryKey: queryKeys.pictures.all });
            }
            if (type === 'quote') {
                await deleteQuote(id);
                queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all });
            }

            router.push(redirectUrl);
            router.refresh();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete item. Please try again.');
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
