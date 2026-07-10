"use client"

import { queryKeys } from "@/src/lib/queries/query-keys";
import {
    Button,
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
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
        return categories.filter((cat: any) =>
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
        <div className="min-h-screen w-full relative overflow-x-hidden bg-[#0a0a0b] text-white">
            {/* Custom Prismatic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/5 blur-[150px] rounded-full" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-pink-900/5 blur-[100px] rounded-full animate-bounce [animation-duration:10s]" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />
            </div>

            <div className="container mx-auto p-6 pt-24 max-w-350 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12"
                >
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm mb-2">
                            Category <span className="text-purple-500">Access</span>
                        </h1>
                        <p className="text-gray-400 font-medium text-sm">Create and manage content segments for the collective</p>
                    </div>
                    <Button
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold h-12 px-8 rounded-2xl shadow-lg shadow-purple-900/20 transition-all active:scale-95"
                        startContent={<Plus size={20} />}
                        onPress={handleOpenAdd}
                    >
                        Add Category
                    </Button>
                </motion.div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center gap-4">
                        <Input
                            isClearable
                            className="w-full sm:max-w-[44%]"
                            placeholder="Search categories by name or ID..."
                            startContent={<Search size={18} className="text-gray-500" />}
                            value={filterValue}
                            onClear={() => setFilterValue("")}
                            onValueChange={setFilterValue}
                            variant="bordered"
                            classNames={{
                                inputWrapper: "bg-white/5 border-white/10 hover:border-white/20 focus-within:!border-purple-500/50 rounded-2xl transition-all"
                            }}
                        />
                    </div>

                    <div className="bg-[#121214]/60 backdrop-blur-2xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                        <Table aria-label="Categories table" removeWrapper className="bg-transparent"><TableHeader><TableColumn className="bg-transparent text-gray-500/50 font-black uppercase tracking-widest text-[10px] py-6 pl-8">ICON</TableColumn><TableColumn className="bg-transparent text-gray-500/50 font-black uppercase tracking-widest text-[10px] py-6">NAME</TableColumn><TableColumn className="bg-transparent text-gray-500/50 font-black uppercase tracking-widest text-[10px] py-6">ID</TableColumn><TableColumn align="end" className="bg-transparent text-gray-500/50 font-black uppercase tracking-widest text-[10px] py-6 pr-8">ACTIONS</TableColumn></TableHeader><TableBody isLoading={isLoading} emptyContent={"No categories found"}>
                            {filteredCategories.map((category: any) => (
                                <TableRow key={category.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                    <TableCell className="pl-8 py-4">
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
                                    <TableCell className="pr-8">
                                        <div className="flex justify-end gap-2 text-white">
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                className="hover:bg-white/10 rounded-xl transition-all"
                                                onPress={() => handleOpenEdit(category)}
                                            >
                                                <Edit2 size={18} className="text-gray-400 hover:text-white transition-colors" />
                                            </Button>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                color="danger"
                                                className="hover:bg-danger/10 rounded-xl transition-all"
                                                onPress={() => {
                                                    setCategoryToDelete(category);
                                                    onDeleteOpen();
                                                }}
                                            >
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody></Table>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                backdrop="blur"
                classNames={{
                    base: "bg-[#121214]/90 backdrop-blur-2xl border border-white/10 rounded-4xl shadow-2xl p-4",
                    header: "text-2xl font-black tracking-tight pt-8 px-8 pb-4 border-b border-white/5",
                    body: "px-8 py-8 gap-6",
                    footer: "px-8 pb-8 pt-4",
                    closeButton: "top-4 right-4 hover:bg-white/5 transition-colors p-2 rounded-xl"
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>{editingCategory ? "Edit Category" : "Add New Category"}</ModalHeader>
                            <ModalBody>
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-gray-400 ml-1">Category Icon</label>
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="relative w-24 h-24 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 transition-all overflow-hidden group"
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
                                                        <Plus className="text-gray-500 mb-1" size={24} />
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Upload</span>
                                                    </>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Plus className="text-white" size={24} />
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <p className="text-xs text-gray-500 font-medium">
                                                    Upload an image to represent this category.
                                                    Square images work best.
                                                </p>
                                                {selectedFile && (
                                                    <div className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-1 rounded-md inline-block font-bold">
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
                                        variant="flat"
                                        value={name}
                                        onValueChange={setName}
                                        isRequired
                                        classNames={{
                                            inputWrapper: "bg-white/5 h-14 rounded-2xl border border-white/5 hover:border-white/10 transition-all",
                                            label: "text-gray-400 font-bold"
                                        }}
                                    />
                                    {editingCategory && (
                                        <Input
                                            label="Manual Icon URL"
                                            placeholder="/categories/minecraft.png"
                                            variant="flat"
                                            value={iconUrl}
                                            onValueChange={setIconUrl}
                                            description="Optional: Override with existing path"
                                            size="sm"
                                            classNames={{
                                                inputWrapper: "bg-white/5 h-14 rounded-2xl border border-white/5 hover:border-white/10 transition-all",
                                                label: "text-gray-400 font-bold"
                                            }}
                                        />
                                    )}
                                    {error && <p className="text-danger text-xs font-bold text-center bg-danger/10 p-2 rounded-lg border border-danger/20">{error}</p>}
                                </div>
                            </ModalBody>
                            <ModalFooter className="flex-col gap-3">
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <Button variant="flat" className="h-12 rounded-2xl font-bold bg-white/5 border border-white/5" onPress={onClose}>CANCEL</Button>
                                    <Button className="h-12 rounded-2xl font-black bg-purple-600 shadow-lg shadow-purple-900/20" onPress={() => handleSave(onClose)} isLoading={isSubmitting}>
                                        {editingCategory ? "UPDATE" : "CREATE"}
                                    </Button>
                                </div>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteOpen}
                onOpenChange={onDeleteOpenChange}
                backdrop="blur"
                classNames={{
                    base: "bg-[#121214]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem]",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-row gap-2 items-center whitespace-nowrap pt-8 px-8 pb-4 border-b border-white/5">
                                Prune <span className="text-danger">Category</span>
                            </ModalHeader>
                            <ModalBody className="px-8 py-6">
                                <p className="text-gray-400">Are you sure you want to delete the category <strong className="text-white">{categoryToDelete?.name}</strong>?</p>
                                <p className="text-xs text-danger/60 mt-4 font-bold uppercase tracking-tighter">Restriction: Only categories with zero dependencies can be pruned.</p>
                            </ModalBody>
                            <ModalFooter className="px-8 pb-8">
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <Button variant="flat" className="h-12 rounded-xl font-bold bg-white/5 border border-white/5" onPress={onClose}>CANCEL</Button>
                                    <Button color="danger" className="h-12 rounded-xl font-bold" onPress={() => handleDelete(onClose)} isLoading={isSubmitting}>
                                        PRUNE
                                    </Button>
                                </div>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
