"use client"

import { queryKeys } from "@/src/lib/queries/query-keys";
import { Picture, PictureListItem, Quote, Video, VideoListItem } from "@/src/lib/types/types";
import {
    Button,
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
import { motion } from "framer-motion";
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
        setIsPublishing(true);
        const res = await toggleVisibility(activeTab, id, !currentStatus);
        if (res.success) {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.content(activeTab, page) });
            if (previewItem?.id === id) {
                setPreviewItem({ ...previewItem, isPublic: !currentStatus });
            }
        }
        setIsPublishing(false);
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
        try {
            const item = await getContentById(activeTab, searchId);
            setPreviewItem(item);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const renderQuotePreview = (quote: any) => {
        if (!quote.messages || quote.messages.length === 0) return "Empty Quote";
        return quote.messages.map((m: any) => m.message).join(" | ").substring(0, 50) + "...";
    };

    return (
        <div className="w-full">
            {/* Custom Prismatic Background */}
            
            <div className="relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
                        Content <span className="text-foreground">Access</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm">Manage visibility and access control for collective media</p>
                </motion.div>

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
                            color="primary"
                            variant="bordered"
                            className="p-1 bg-muted backdrop-blur-md rounded-2xl border border-border w-fit"
                            classNames={{
                                tabList: "gap-2 border-0 bg-transparent p-0",
                                cursor: "bg-primary text-primary-foreground rounded-xl",
                                tab: "h-11 px-8 font-semibold transition-all",
                                tabContent: "text-muted-foreground group-data-[selected=true]:text-primary-foreground"
                            }}
                        >
                            <Tab key="video" title="Videos" />
                            <Tab key="picture" title="Pictures" />
                            <Tab key="quote" title="Quotes" />
                        </Tabs>

                        <div className="bg-card/70 backdrop-blur-md border border-border rounded-2xl overflow-x-auto shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-muted-foreground mb-6 px-2">Published {activeTab}s <span className="text-foreground">({total})</span></h3>

                            {isLoading ? (
                                <div className="space-y-3 p-2">
                                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
                                </div>
                            ) : items.length > 0 ? (
                                <div className="space-y-2">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted transition-colors border border-transparent hover:border-border group">
                                            <div className="relative w-20 h-12 rounded-xl overflow-hidden bg-black/40 shrink-0 border border-border group-hover:border-border transition-all shadow-lg">
                                                {activeTab === 'quote' ? (
                                                    <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground font-semibold">Quote</div>
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
                                                <p className="font-bold truncate text-foreground">{(item as any).title || renderQuotePreview(item)}</p>
                                                <p className="text-[11px] font-bold text-muted-foreground">by {item.uploadedBy?.username} • {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                color="danger"
                                                variant="flat"
                                                className="rounded-xl font-bold"
                                                startContent={<EyeOff size={14} />}
                                                onPress={() => handleToggle(item.id, true)}
                                            >
                                                Unpublish
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center">
                                    <p className="text-muted-foreground font-semibold text-sm">No published content found</p>
                                </div>
                            )}

                            {total > 20 && (
                                <div className="flex justify-center mt-8">
                                    <Pagination
                                        total={Math.ceil(total / 20)}
                                        page={page}
                                        onChange={setPage}
                                        color="primary"
                                        variant="flat"
                                        classNames={{
                                            cursor: "bg-primary text-primary-foreground rounded-xl",
                                            item: "rounded-xl font-bold",
                                            prev: "rounded-xl",
                                            next: "rounded-xl"
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Publish by ID */}
                    <div className="space-y-6">
                        <div className="bg-card/70 backdrop-blur-md border border-border rounded-2xl overflow-x-auto shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-6">Publish by ID</h3>
                            <div className="flex flex-col gap-6">
                                <Input
                                    label="CONTENT ID"
                                    placeholder="Paste ID here..."
                                    variant="flat"
                                    value={searchId}
                                    onValueChange={setSearchId}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    classNames={{
                                        inputWrapper: "bg-muted h-14 rounded-2xl border border-border hover:border-border transition-all",
                                        label: "text-muted-foreground font-bold",
                                        input: "font-mono"
                                    }}
                                    endContent={
                                        <Button isIconOnly size="sm" variant="light" className="hover:bg-muted rounded-xl transition-all" onPress={handleSearch} isLoading={isSearching}>
                                            <Search size={18} className="text-muted-foreground" />
                                        </Button>
                                    }
                                />

                                {previewItem && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-4 rounded-2xl bg-muted border border-border"
                                    >
                                        <p className="text-[10px] text-foreground uppercase font-semibold tracking-widest mb-4">Identification Preview</p>
                                        <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-black/40 border border-border shadow-2xl">
                                            {(activeTab === 'video' || activeTab === 'picture') && (
                                                <Image
                                                    src={(previewItem as Video | Picture).thumbnailUrl}
                                                    alt=""
                                                    fill
                                                    className="object-cover"
                                                />
                                            )}
                                            {activeTab === 'quote' && (
                                                <div className="p-4 text-xs italic h-full flex items-center justify-center text-center text-muted-foreground">
                                                    &quot;{renderQuotePreview(previewItem)}&quot;
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-semibold truncate text-foreground uppercase tracking-tight text-lg">{(previewItem as any).title || "Quote"}</p>
                                        <p className="text-[11px] font-bold text-muted-foreground mb-6">Uploaded by {previewItem.uploadedBy?.username}</p>

                                        <Button
                                            fullWidth
                                            color={previewItem.isPublic ? "danger" : "primary"}
                                            className={`h-12 rounded-2xl font-semibold ${previewItem.isPublic ? 'bg-danger/10 text-danger hover:bg-danger/20' : 'bg-primary text-primary-foreground'}`}
                                            startContent={previewItem.isPublic ? <EyeOff size={18} /> : <Eye size={18} />}
                                            onPress={() => handleToggle(previewItem.id, previewItem.isPublic)}
                                            isLoading={isPublishing}
                                        >
                                            {previewItem.isPublic ? "Unpublish" : "Publish"}
                                        </Button>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-4 bg-muted rounded-2xl border border-border backdrop-blur-md">
                            <Search size={16} className="text-foreground shrink-0" />
                            <p className="text-[10px] text-muted-foreground font-bold leading-relaxed">
                                Tip: Pasting a direct ID sidesteps database hydration lag.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Unpublish Confirmation Modal */}
                <Modal
                    isOpen={isUnpublishOpen}
                    onOpenChange={onUnpublishOpenChange}
                    backdrop="blur"
                    classNames={{
                        base: "bg-elevated border border-border rounded-2xl",
                    }}
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-row gap-2 items-center whitespace-nowrap pt-8 px-8 pb-4 border-b border-border">
                                    Revoke <span className="text-danger">Visibility</span>
                                </ModalHeader>
                                <ModalBody className="px-8 py-6">
                                    <p className="text-muted-foreground">Are you sure you want to unpublish this {activeTab}?</p>
                                    <p className="text-xs text-danger/60 mt-4 font-bold">
                                        Action: Regular members will lose access, but the archive remains intact.
                                    </p>
                                </ModalBody>
                                <ModalFooter className="px-8 pb-8">
                                    <div className="grid grid-cols-2 gap-3 w-full">
                                        <Button variant="flat" className="h-12 rounded-xl font-bold bg-muted border border-border" onPress={onClose}>CANCEL</Button>
                                        <Button color="danger" className="h-12 rounded-xl font-bold" onPress={() => confirmUnpublish(onClose)}>
                                            UNPUBLISH
                                        </Button>
                                    </div>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>
            </div>
        </div>
    );
}
