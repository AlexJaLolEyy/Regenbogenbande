"use client"

import { queryKeys } from "@/src/lib/queries/query-keys";
import { MODAL_CLASSNAMES } from "@/src/lib/components/ui/form-kit";
import { CategoryBadge } from "@/src/lib/components/ui/category-badge";
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Skeleton,
    useDisclosure
} from "@heroui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowUpRight, Edit2, MoreVertical, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { CategoryWithCounts as Category } from "@/src/lib/db/selects/categories";
import { createCategory, editCategory, fetchCategories, removeCategory } from "./actions";

export default function CategoriesAdminPage() {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();

    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [name, setName] = useState("");
    const [iconUrl, setIconUrl] = useState("");
    const [error, setError] = useState("");
    const [deleteError, setDeleteError] = useState("");

    // Search with Debounce
    const [filterValue, setFilterValue] = useState("");
    const [debouncedFilterValue, setDebouncedFilterValue] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilterValue(filterValue);
        }, 500);
        return () => clearTimeout(timer);
    }, [filterValue]);

    const { data: categories = [], isLoading } = useQuery({
        queryKey: queryKeys.categories.all,
        queryFn: fetchCategories
    });

    const filteredCategories = useMemo(() => {
        if (!debouncedFilterValue) return categories;
        return categories.filter((cat) =>
            cat.name.toLowerCase().includes(debouncedFilterValue.toLowerCase()) ||
            cat.id.toLowerCase().includes(debouncedFilterValue.toLowerCase())
        );
    }, [categories, debouncedFilterValue]);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");

    const handleOpenAdd = () => {
        setEditingCategory(null);
        setName("");
        setIconUrl("");
        setSelectedFile(null);
        setPreviewUrl("");
        setError("");
        onOpen();
    };

    const handleOpenEdit = (category: Category) => {
        setEditingCategory(category);
        setName(category.name);
        setIconUrl(category.iconUrl || "");
        setSelectedFile(null);
        setPreviewUrl(category.iconUrl || "");
        setError("");
        onOpen();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async (onClose: () => void) => {
        if (!name) {
            setError("Name is required");
            return;
        }

        setIsSubmitting(true);
        setError("");

        let finalIconUrl = iconUrl;

        // If a new file is selected, upload it first
        if (selectedFile) {
            const formData = new FormData();
            formData.append("icon", selectedFile);
            formData.append("name", name);

            try {
                const uploadRes = await fetch("/api/categories/upload", {
                    method: "POST",
                    body: formData,
                });
                const uploadData = await uploadRes.json();
                if (uploadData.url) {
                    finalIconUrl = uploadData.url;
                } else {
                    setError("Icon upload failed");
                    setIsSubmitting(false);
                    return;
                }
            } catch (err) {
                setError("Icon upload failed");
                setIsSubmitting(false);
                return;
            }
        }

        const res = editingCategory
            ? await editCategory(editingCategory.id, name, finalIconUrl)
            : await createCategory(name, finalIconUrl);

        if (res.success) {
            await queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
            onClose();
        } else {
            setError(res.error || "Something went wrong");
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (onClose: () => void) => {
        if (!categoryToDelete) return;
        setIsSubmitting(true);
        const res = await removeCategory(categoryToDelete.id);
        if (res.success) {
            await queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
            onClose();
        } else {
            setDeleteError(res.error || "Failed to delete");
        }
        setIsSubmitting(false);
    };

    const openDelete = (category: Category) => {
        setCategoryToDelete(category);
        setDeleteError("");
        onDeleteOpen();
    };

    const blocked = !!categoryToDelete && (categoryToDelete.videoCount > 0 || categoryToDelete.pictureCount > 0);

    const usage = (c: Category) => {
        const parts = [
            `${c.videoCount} ${c.videoCount === 1 ? "video" : "videos"}`,
            `${c.pictureCount} ${c.pictureCount === 1 ? "picture" : "pictures"}`,
        ];
        return parts.join(" · ");
    };

    return (
        <div className="w-full">
            <div className="relative z-10 px-4 pt-6 md:px-8">
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end"
                >
                    <div>
                        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Categories</h1>
                        <p className="text-sm text-muted-foreground">Group videos and pictures. Quotes do not use categories.</p>
                    </div>
                    <Button
                        className="h-11 rounded-xl bg-primary px-6 font-medium text-primary-foreground hover:opacity-90"
                        startContent={<Plus size={18} />}
                        onPress={handleOpenAdd}
                    >
                        Add category
                    </Button>
                </motion.div>

                <div className="mb-6">
                    <Input
                        isClearable
                        className="w-full sm:max-w-sm"
                        placeholder="Search categories..."
                        aria-label="Search categories"
                        startContent={<Search size={16} className="text-muted-foreground" />}
                        value={filterValue}
                        onClear={() => setFilterValue("")}
                        onValueChange={setFilterValue}
                        variant="bordered"
                        classNames={{ inputWrapper: "bg-muted border-border hover:border-foreground/30 focus-within:border-theme-accent! rounded-xl" }}
                    />
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">No categories found.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredCategories.map((category) => (
                            <div key={category.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-md transition-colors hover:border-foreground/20">
                                <div className="flex items-start gap-4">
                                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted text-lg font-semibold uppercase text-muted-foreground">
                                        {category.iconUrl ? (
                                            <Image src={category.iconUrl} alt="" fill className="object-cover" />
                                        ) : (
                                            category.name[0]
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-base font-semibold text-foreground">{category.name}</p>
                                        <p className="text-sm text-muted-foreground">{usage(category)}</p>
                                    </div>
                                    <Dropdown placement="bottom-end">
                                        <DropdownTrigger>
                                            <Button isIconOnly size="sm" variant="light" aria-label={`Actions for ${category.name}`} className="rounded-xl text-muted-foreground">
                                                <MoreVertical size={16} />
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu aria-label="Category actions">
                                            <DropdownItem key="edit" startContent={<Edit2 size={14} />} onPress={() => handleOpenEdit(category)}>
                                                Edit
                                            </DropdownItem>
                                            <DropdownItem key="delete" color="danger" className="text-danger" startContent={<Trash2 size={14} />} onPress={() => openDelete(category)}>
                                                Delete
                                            </DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>
                                </div>
                                <Link
                                    href={`/${category.videoCount === 0 && category.pictureCount > 0 ? "pictures" : "videos"}?category=${category.id}`}
                                    className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-theme-accent focus-visible:outline-2 outline-theme-accent"
                                >
                                    View items
                                    <ArrowUpRight size={14} />
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur" classNames={MODAL_CLASSNAMES}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>{editingCategory ? "Edit category" : "New category"}</ModalHeader>
                            <ModalBody className="gap-4 py-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-muted-foreground">Icon</label>
                                    <div className="flex items-center gap-4">
                                        <button
                                            type="button"
                                            className="group relative flex h-24 w-24 shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted transition-colors hover:border-foreground/30 focus-visible:outline-2 outline-theme-accent"
                                            onClick={() => document.getElementById("category-icon-upload")?.click()}
                                            aria-label="Upload icon"
                                        >
                                            {previewUrl ? (
                                                <Image src={previewUrl} alt="Icon preview" fill className="object-cover" />
                                            ) : (
                                                <>
                                                    <Plus className="mb-1 text-muted-foreground" size={24} />
                                                    <span className="text-[11px] font-medium text-muted-foreground">Upload</span>
                                                </>
                                            )}
                                        </button>
                                        <div className="flex-1 space-y-2">
                                            <p className="text-xs text-muted-foreground">Upload an image for this category. Square images work best.</p>
                                            {selectedFile && (
                                                <span className="inline-block rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">{selectedFile.name}</span>
                                            )}
                                        </div>
                                    </div>
                                    <input id="category-icon-upload" type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                                </div>
                                <Input
                                    label="Name"
                                    placeholder="e.g. Minecraft, Just Chatting"
                                    variant="bordered"
                                    value={name}
                                    onValueChange={setName}
                                    isRequired
                                    classNames={{ inputWrapper: "bg-muted border-border h-12 focus-within:border-theme-accent!" }}
                                />
                                {editingCategory && (
                                    <Input
                                        label="Icon URL"
                                        placeholder="/categories/minecraft.png"
                                        variant="bordered"
                                        value={iconUrl}
                                        onValueChange={setIconUrl}
                                        description="Optional: use an existing image path instead of uploading."
                                        classNames={{ inputWrapper: "bg-muted border-border h-12 focus-within:border-theme-accent!" }}
                                    />
                                )}
                                {error && <p role="alert" className="rounded-lg border border-danger/20 bg-danger/10 p-2 text-center text-xs font-medium text-danger">{error}</p>}
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" className="h-11 rounded-xl" onPress={onClose}>Cancel</Button>
                                <Button className="h-11 rounded-xl bg-primary px-6 font-medium text-primary-foreground" onPress={() => handleSave(onClose)} isLoading={isSubmitting}>
                                    {editingCategory ? "Save changes" : "Create category"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Delete */}
            <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange} backdrop="blur" classNames={MODAL_CLASSNAMES}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Delete category?</ModalHeader>
                            <ModalBody className="gap-3 py-6">
                                {categoryToDelete && <CategoryBadge category={categoryToDelete} className="self-start" />}
                                {blocked ? (
                                    <p className="text-sm text-muted-foreground">
                                        This category is used by <strong className="text-foreground">{usage(categoryToDelete!)}</strong>. Move or delete those items first, then you can delete the category.
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No items use this category. Deleting it cannot be undone.
                                    </p>
                                )}
                                {deleteError && <p role="alert" className="rounded-lg border border-danger/20 bg-danger/10 p-2 text-center text-sm text-danger">{deleteError}</p>}
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" className="h-11 rounded-xl" onPress={onClose}>Cancel</Button>
                                <Button color="danger" className="h-11 rounded-xl font-medium" isDisabled={blocked} onPress={() => handleDelete(onClose)} isLoading={isSubmitting}>
                                    Delete
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}