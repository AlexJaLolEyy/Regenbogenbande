import { prisma } from "@/src/lib/prisma";
import { Category } from "@/src/lib/types/types";

export async function addCategory(name: string, iconUrl?: string): Promise<Category> {
    try {
        const category = await prisma.category.create({
            data: {
                name,
                iconUrl: iconUrl || null,
            },
        });
        return {
            id: category.id,
            name: category.name,
            iconUrl: category.iconUrl,
        };
    } catch (error) {
        console.error('Error adding category:', error);
        throw error;
    }
}

export async function updateCategory(id: string, data: { name?: string; iconUrl?: string }): Promise<Category> {
    try {
        const category = await prisma.category.update({
            where: { id },
            data: {
                ...(data.name ? { name: data.name } : {}),
                ...(data.iconUrl !== undefined ? { iconUrl: data.iconUrl } : {}),
            },
        });
        return {
            id: category.id,
            name: category.name,
            iconUrl: category.iconUrl,
        };
    } catch (error) {
        console.error('Error updating category:', error);
        throw error;
    }
}

export async function deleteCategory(id: string): Promise<void> {
    try {
        // Check if category has linked content
        const linkedVideos = await prisma.video.count({ where: { categoryId: id } });
        const linkedPictures = await prisma.picture.count({ where: { categoryId: id } });

        if (linkedVideos > 0 || linkedPictures > 0) {
            throw new Error(`Cannot delete category with ${linkedVideos} videos and ${linkedPictures} pictures linked.`);
        }

        await prisma.category.delete({
            where: { id },
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
    }
}
