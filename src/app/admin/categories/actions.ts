"use server"

import { requireAdminOrOwner } from "@/src/lib/auth-utils";
import { addCategory as _addCategory, deleteCategory as _deleteCategory, updateCategory as _updateCategory } from "@/src/lib/db/mutations/categories";
import { getAllCategories as _getAllCategories } from "@/src/lib/db/selects/categories";
import { revalidatePath } from "next/cache";

export async function fetchCategories() {
    await requireAdminOrOwner();
    return await _getAllCategories();
}

export async function createCategory(name: string, iconUrl?: string) {
    await requireAdminOrOwner();
    try {
        const category = await _addCategory(name, iconUrl);
        revalidatePath("/admin/categories");
        revalidatePath("/video-upload"); // revalidate pages that use categories
        revalidatePath("/picture-upload");
        return { success: true, category };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create category" };
    }
}

export async function editCategory(id: string, name?: string, iconUrl?: string) {
    await requireAdminOrOwner();
    try {
        const category = await _updateCategory(id, { name, iconUrl });
        revalidatePath("/admin/categories");
        revalidatePath("/video-upload");
        revalidatePath("/picture-upload");
        return { success: true, category };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update category" };
    }
}

export async function removeCategory(id: string) {
    await requireAdminOrOwner();
    try {
        await _deleteCategory(id);
        revalidatePath("/admin/categories");
        revalidatePath("/video-upload");
        revalidatePath("/picture-upload");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete category" };
    }
}
