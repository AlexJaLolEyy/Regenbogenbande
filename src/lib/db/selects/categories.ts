import { prisma } from "@/src/lib/prisma";
import { Category } from "@/src/lib/types/types";

export async function getAllCategories(): Promise<Category[]> {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
        });
        return categories.map(c => ({
            id: c.id,
            name: c.name,
            iconUrl: c.iconUrl,
        }));
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}
export async function getCategoryById(id: string): Promise<Category | null> {
    try {
        const category = await prisma.category.findUnique({
            where: { id },
        });
        if (!category) return null;
        return {
            id: category.id,
            name: category.name,
            iconUrl: category.iconUrl,
        };
    } catch (error) {
        console.error('Error fetching category by ID:', error);
        return null;
    }
}
