import { NextRequest, NextResponse } from 'next/server';
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

    const mimeType = file.type || 'image/png';
    const base64String = `data:${mimeType};base64,${buffer.toString('base64')}`;

    // Return the base64 string as the URL
    // This bypasses Vercel/AWS Lambda read-only file systems 
    // and saves the image directly into PostgreSQL as a text string!
    return NextResponse.json({ url: base64String });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: `Upload failed: ${error?.message || 'Unknown server error'}` }, { status: 500 });
  }
}
