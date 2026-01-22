"use client"

import { queryKeys } from "@/src/lib/queries/query-keys";
import { Picture, PictureListItem, Quote, Video, VideoListItem } from "@/src/lib/types/types";
import {
    Button,
    Card,
    CardBody,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Pagination,
    Tab,
    Tabs,
    useDisclosure
} from "@heroui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Search } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { getContentById, getPublishedContent, toggleVisibility } from "./actions";

type ContentType = 'video' | 'picture' | 'quote';

export default function ContentAdminPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<ContentType>("video");
    const [page, setPage] = useState(1);

    // Search/Publish by ID state
    const [searchId, setSearchId] = useState("");
    const [previewItem, setPreviewItem] = useState<Video | Picture | Quote | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: queryKeys.admin.content(activeTab, page),
        queryFn: () => getPublishedContent(activeTab, page)
    });

    const items = data?.items || [];
    const total = data?.total || 0;

    const { isOpen: isUnpublishOpen, onOpen: onUnpublishOpen, onOpenChange: onUnpublishOpenChange } = useDisclosure();
    const [itemToUnpublish, setItemToUnpublish] = useState<{ id: string, status: boolean } | null>(null);

    const handleToggle = async (id: string, currentStatus: boolean | undefined) => {
        // If currentStatus is true, we are UNPUBLISHING. Show confirmation.
        if (currentStatus === true) {
            setItemToUnpublish({ id, status: currentStatus });
            onUnpublishOpen();
            return;
        }

        // If currentStatus is false (or undefined), we are PUBLISHING. Proceed immediately.
        await executeToggle(id, currentStatus || false);
    };

    const executeToggle = async (id: string, currentStatus: boolean) => {
        const res = await toggleVisibility(activeTab, id, !currentStatus);
        if (res.success) {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.content(activeTab, page) });
            if (previewItem?.id === id) {
                setPreviewItem({ ...previewItem, isPublic: !currentStatus });
            }
        }
    };

    const confirmUnpublish = async (onClose: () => void) => {
        if (!itemToUnpublish) return;
        await executeToggle(itemToUnpublish.id, true);
        onClose();
    };

    const handleSearch = async () => {
        if (!searchId) return;
        setIsSearching(true);
        setPreviewItem(null);
        const item = await getContentById(activeTab, searchId);
        setPreviewItem(item);
        setIsSearching(false);
    };

    const renderQuotePreview = (quote: any) => {
        return quote.messages?.map((m: any) => m.message).join(" | ").substring(0, 50) + "...";
    };

    return (
        <div className="container mx-auto p-6 pt-24 max-w-6xl">
            <h1 className="text-3xl font-bold mb-8 bg-linear-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent">
                Content Visibility Management
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Published List */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs
                        selectedKey={activeTab}
                        onSelectionChange={(key) => {
                            setActiveTab(key as ContentType);
                            setPage(1);
                            setPreviewItem(null);
                        }}
                        variant="bordered"
                    >
                        <Tab key="video" title="Videos" />
                        <Tab key="picture" title="Pictures" />
                        <Tab key="quote" title="Quotes" />
                    </Tabs>

                    <Card className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-white/20">
                        <CardBody className="p-4">
                            <h3 className="text-lg font-semibold mb-4 px-2">Published {activeTab}s ({total})</h3>

                            {isLoading ? (
                                <div className="space-y-3 p-2">
                                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
                                </div>
                            ) : items.length > 0 ? (
                                <div className="space-y-2">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                                            <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-black/40 shrink-0">
                                                {activeTab === 'quote' ? (
                                                    <div className="flex items-center justify-center h-full text-[10px] text-default-400">Quote</div>
                                                ) : (
                                                    <Image
                                                        src={(item as VideoListItem | PictureListItem).thumbnailUrl}
                                                        alt=""
                                                        fill
                                                        className="object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="grow min-w-0">
                                                <p className="font-medium truncate">{(item as any).title || renderQuotePreview(item)}</p>
                                                <p className="text-xs text-default-400">by {item.uploadedBy?.username} • {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                color="danger"
                                                variant="flat"
                                                startContent={<EyeOff size={14} />}
                                                onPress={() => handleToggle(item.id, true)}
                                            >
                                                Unpublish
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-10 text-default-400">No published content found.</p>
                            )}

                            {total > 20 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination total={Math.ceil(total / 20)} page={page} onChange={setPage} />
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Right: Publish by ID */}
                <div className="space-y-6">
                    <Card className="bg-linear-to-br from-blue-500/10 to-teal-500/10 border-blue-500/20 backdrop-blur-xl">
                        <CardBody className="p-6">
                            <h3 className="text-lg font-bold mb-4">Publish by ID</h3>
                            <div className="flex flex-col gap-4">
                                <Input
                                    label="Content ID"
                                    placeholder="Paste ID here..."
                                    variant="bordered"
                                    value={searchId}
                                    onValueChange={setSearchId}
                                    endContent={
                                        <Button isIconOnly size="sm" variant="light" onPress={handleSearch} isLoading={isSearching}>
                                            <Search size={18} />
                                        </Button>
                                    }
                                />

                                {previewItem && (
                                    <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 animate-in fade-in slide-in-from-top-2">
                                        <p className="text-xs text-default-400 uppercase font-bold mb-2">Preview</p>
                                        <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-black/40">
                                            {(activeTab === 'video' || activeTab === 'picture') && (
                                                <Image
                                                    src={(previewItem as Video | Picture).thumbnailUrl}
                                                    alt=""
                                                    fill
                                                    className="object-cover"
                                                />
                                            )}
                                            {activeTab === 'quote' && (
                                                <div className="p-3 text-sm italic h-full flex items-center justify-center">
                                                    &quot;{renderQuotePreview(previewItem)}&quot;
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-bold truncate">{(previewItem as any).title || "Quote"}</p>
                                        <p className="text-xs text-default-400 mb-4">Uploaded by {previewItem.uploadedBy?.username}</p>

                                        <Button
                                            fullWidth
                                            color={previewItem.isPublic ? "danger" : "primary"}
                                            variant={previewItem.isPublic ? "flat" : "solid"}
                                            startContent={previewItem.isPublic ? <EyeOff size={18} /> : <Eye size={18} />}
                                            onPress={() => handleToggle(previewItem.id, previewItem.isPublic)}
                                            isLoading={isPublishing}
                                        >
                                            {previewItem.isPublic ? "Unpublish" : "Publish Content"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                    <p className="text-[10px] text-default-400 px-2 italic uppercase">
                        Tip: Pasting an ID avoids loading 1000s of items from the database.
                    </p>
                </div>
            </div>
            {/* Unpublish Confirmation Modal */}
            <Modal isOpen={isUnpublishOpen} onOpenChange={onUnpublishOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Confirm Unpublish</ModalHeader>
                            <ModalBody>
                                <p>Are you sure you want to unpublish this {activeTab}?</p>
                                <p className="text-sm text-default-500 mt-2">
                                    It will no longer be visible to regular users, but will remain in the database.
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose}>Cancel</Button>
                                <Button color="danger" onPress={() => confirmUnpublish(onClose)}>
                                    Unpublish
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
