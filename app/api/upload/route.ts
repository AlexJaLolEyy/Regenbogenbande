// app/api/upload/route.ts - first implementation of api route for saving uploaded video

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const video = formData.get('video') as File;

    if (!video) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    const buffer = Buffer.from(await video.arrayBuffer());
    const filePath = path.join("public/exampleVideos/", video.name);

    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ message: 'File uploaded successfully!' });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
  }
}
