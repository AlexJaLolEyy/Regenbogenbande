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
