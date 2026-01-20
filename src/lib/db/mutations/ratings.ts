import { Rating } from "@/src/lib/types/types";

export async function calculateMediaRating(ratings: Rating[]): Promise<number> {
    if (ratings.length !== 0) {
        return ratings.reduce((sum, rating) => sum + rating.value, 0) / ratings.length;
    } else {
        return 0;
    }
}
