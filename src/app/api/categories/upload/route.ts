import { guardApi } from "@/src/lib/api-auth";
import { uploadFile } from "@/src/lib/storage-adapter";
import { NextResponse } from "next/server";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};

export async function POST(req: Request) {
    const guard = await guardApi("admin");
    if (guard.response) return guard.response;

    try {
        const formData = await req.formData();
        const icon = formData.get("icon");
        const name = String(formData.get("name") ?? "category");

        if (!(icon instanceof File)) {
            return NextResponse.json({ error: "No icon uploaded" }, { status: 400 });
        }
        const extension = ALLOWED[icon.type];
        if (!extension) {
            return NextResponse.json({ error: "Unsupported icon type" }, { status: 400 });
        }
        if (icon.size > MAX_BYTES) {
            return NextResponse.json({ error: "Icon must be 2MB or smaller" }, { status: 400 });
        }

        const fileName = `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${crypto.randomUUID().substring(0, 8)}${extension}`;
        const key = `categories/${fileName}`;

        const buffer = Buffer.from(await icon.arrayBuffer());
        const url = await uploadFile(buffer, key, icon.type);

        return NextResponse.json({ url });
    } catch (error) {
        console.error("Category icon upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
