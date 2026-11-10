import { getEffectiveRole, getSession } from "@/src/lib/auth-utils";
import { uploadFile } from "@/src/lib/storage-adapter";
import { NextResponse } from "next/server";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};

/** Uploads an avatar for the signed-in user and returns its public URL. */
export async function POST(req: Request) {
    const session = await getSession();
    if (!session?.user || getEffectiveRole(session) === "guest") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("avatar");

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
        }
        const extension = ALLOWED[file.type];
        if (!extension) {
            return NextResponse.json({ error: "Only JPEG, PNG or WebP images are allowed" }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
            return NextResponse.json({ error: "Image must be 5MB or smaller" }, { status: 400 });
        }

        const key = `avatars/${session.user.id}-${crypto.randomUUID().substring(0, 8)}${extension}`;
        const url = await uploadFile(Buffer.from(await file.arrayBuffer()), key, file.type);

        return NextResponse.json({ url });
    } catch (error) {
        console.error("Avatar upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
