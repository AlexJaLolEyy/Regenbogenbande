"use client"

import { queryKeys } from "@/src/lib/queries/query-keys";
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
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    useDisclosure
} from "@heroui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { createCategory, editCategory, fetchCategories, removeCategory } from "./actions";

export default function CategoriesAdminPage() {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();

    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
    const [name, setName] = useState("");
    const [iconUrl, setIconUrl] = useState("");
    const [error, setError] = useState("");

    const { data: categories = [], isLoading } = useQuery({
        queryKey: queryKeys.categories.all,
        queryFn: fetchCategories
    });

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

    const handleOpenEdit = (category: any) => {
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
            alert(res.error || "Failed to delete");
        }
        setIsSubmitting(false);
    };

    return (
        <div className="container mx-auto p-6 pt-24 max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-linear-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent">
                        Category Management
                    </h1>
                    <p className="text-default-500 text-sm">Create and manage content categories</p>
                </div>
                <Button
                    color="primary"
                    startContent={<Plus size={18} />}
                    onPress={handleOpenAdd}
                >
                    Add Category
                </Button>
            </div>

            <Card className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-white/20">
                <CardBody className="p-0">
                    <Table aria-label="Categories table" removeWrapper>
                        <TableHeader>
                            <TableColumn>ICON</TableColumn>
                            <TableColumn>NAME</TableColumn>
                            <TableColumn>ID</TableColumn>
                            <TableColumn align="center">ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody isLoading={isLoading} emptyContent={"No categories found"}>
                            {categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell>
                                        {category.iconUrl ? (
                                            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                                                <Image
                                                    src={category.iconUrl}
                                                    alt={category.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-lg bg-default-100 flex items-center justify-center text-[10px] text-default-400">
                                                None
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell className="text-xs text-default-400 font-mono">{category.id}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-center gap-2">
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                onPress={() => handleOpenEdit(category)}
                                            >
                                                <Edit2 size={16} className="text-default-500" />
                                            </Button>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                color="danger"
                                                onPress={() => {
                                                    setCategoryToDelete(category);
                                                    onDeleteOpen();
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            {/* Add/Edit Modal */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>{editingCategory ? "Edit Category" : "Add New Category"}</ModalHeader>
                            <ModalBody>
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Category Icon</label>
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="relative w-24 h-24 rounded-2xl bg-default-100 border-2 border-dashed border-default-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden group"
                                                onClick={() => document.getElementById("category-icon-upload")?.click()}
                                            >
                                                {previewUrl ? (
                                                    <Image
                                                        src={previewUrl}
                                                        alt="Icon preview"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <>
                                                        <Plus className="text-default-400 mb-1" size={20} />
                                                        <span className="text-[10px] text-default-400">Upload</span>
                                                    </>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Plus className="text-white" size={24} />
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <p className="text-xs text-default-500">
                                                    Upload an image to represent this category.
                                                    Square images work best.
                                                </p>
                                                {selectedFile && (
                                                    <div className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md inline-block">
                                                        {selectedFile.name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <input
                                            id="category-icon-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                        />
                                    </div>
                                    <Input
                                        label="Category Name"
                                        placeholder="e.g. Minecraft, Just Chatting"
                                        variant="bordered"
                                        value={name}
                                        onValueChange={setName}
                                        isRequired
                                    />
                                    {editingCategory && (
                                        <Input
                                            label="Manual Icon URL"
                                            placeholder="/categories/minecraft.png"
                                            variant="bordered"
                                            value={iconUrl}
                                            onValueChange={setIconUrl}
                                            description="Optional: Override with existing path"
                                            size="sm"
                                        />
                                    )}
                                    {error && <p className="text-danger text-xs">{error}</p>}
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose}>Cancel</Button>
                                <Button color="primary" onPress={() => handleSave(onClose)} isLoading={isSubmitting}>
                                    {editingCategory ? "Update" : "Create"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange} backdrop="blur">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Confirm Deletion</ModalHeader>
                            <ModalBody>
                                <p>Are you sure you want to delete the category <strong>{categoryToDelete?.name}</strong>?</p>
                                <p className="text-xs text-danger mt-2">Note: You can only delete categories that have no videos or pictures linked to them.</p>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose}>Cancel</Button>
                                <Button color="danger" onPress={() => handleDelete(onClose)} isLoading={isSubmitting}>
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
