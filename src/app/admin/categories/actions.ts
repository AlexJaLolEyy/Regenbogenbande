"use server"

import { requireAdminOrOwner } from "@/src/lib/auth-utils";
import { addCategory as _addCategory, deleteCategory as _deleteCategory, updateCategory as _updateCategory } from "@/src/lib/db/mutations/categories";
import { getCategoriesWithCounts as _getCategoriesWithCounts } from "@/src/lib/db/selects/categories";
import { revalidatePath } from "next/cache";

export async function fetchCategories() {
    await requireAdminOrOwner();
    return await _getCategoriesWithCounts();
}

export async function createCategory(name: string, iconUrl?: string) {
    await requireAdminOrOwner();
    try {
        const category = await _addCategory(name, iconUrl);
        revalidatePath("/admin/categories");
        revalidatePath("/videos/upload"); // revalidate pages that use categories
        revalidatePath("/pictures/upload");
        return { success: true, category };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to create category" };
    }
}

export async function editCategory(id: string, name?: string, iconUrl?: string) {
    await requireAdminOrOwner();
    try {
        const category = await _updateCategory(id, { name, iconUrl });
        revalidatePath("/admin/categories");
        revalidatePath("/videos/upload");
        revalidatePath("/pictures/upload");
        return { success: true, category };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to update category" };
    }
}

export async function removeCategory(id: string) {
    await requireAdminOrOwner();
    try {
        await _deleteCategory(id);
        revalidatePath("/admin/categories");
        revalidatePath("/videos/upload");
        revalidatePath("/pictures/upload");
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete category" };
    }
}
