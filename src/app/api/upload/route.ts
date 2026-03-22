import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    
    if (!session || role !== 'ADMIN') {
       return NextResponse.json({ error: 'Unauthorized to upload assets' }, { status: 403 });
    }

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get the file extension
    const extension = file.name.split('.').pop();
    if (!extension || !['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(extension.toLowerCase())) {
        return NextResponse.json({ error: 'Invalid file type. Only standard images are allowed.' }, { status: 400 });
    }

    const uniqueId = crypto.randomUUID();
    const filename = `logo-${uniqueId}.${extension}`;
    const filePath = join(process.cwd(), 'public/uploads', filename);

    await writeFile(filePath, buffer);

    // Return the URL
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Upload failed internally' }, { status: 500 });
  }
}
