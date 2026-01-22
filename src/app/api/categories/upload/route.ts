import { uploadFile } from "@/src/lib/storage-adapter";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const icon = formData.get("icon") as File;
        const name = formData.get("name") as string;

        if (!icon) {
            return NextResponse.json({ error: "No icon uploaded" }, { status: 400 });
        }

        const extension = icon.name.substring(icon.name.lastIndexOf("."));
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
