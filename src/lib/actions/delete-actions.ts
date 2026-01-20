"use server"

import { deletePicture as _deletePicture } from '@/src/lib/db/mutations/pictures';
import { deleteQuote as _deleteQuote } from '@/src/lib/db/mutations/quotes';
import { deleteVideo as _deleteVideo } from '@/src/lib/db/mutations/videos';

export async function deleteVideo(id: string): Promise<void> {
    return _deleteVideo(id);
}

export async function deletePicture(id: string): Promise<void> {
    return _deletePicture(id);
}

export async function deleteQuote(id: string): Promise<void> {
    return _deleteQuote(id);
}
