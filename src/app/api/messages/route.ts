import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/access';

// GET messages (inbox for teachers, history for admin)
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'received'; // 'sent', 'received'

    const where: any = {};
    if (mode === 'received') {
      where.OR = [
        { recipientId: user.id },
        { recipientId: null }, // broadcast to all
      ];
    } else if (mode === 'sent') {
      where.senderId = user.id;
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: { select: { name: true, role: true } },
        recipient: { select: { name: true, role: true } },
      },
      orderBy: { sentAt: 'desc' },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST send message
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const body = await request.json();
    const { recipientId, subject, content, type } = body;

    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        recipientId: recipientId === 'all' ? null : recipientId,
        subject: subject || '',
        content,
        type: type || 'GENERAL',
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Message POST error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// PATCH mark as read
export async function PATCH(request: NextRequest) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { messageId } = body;

        await prisma.message.update({
            where: { id: messageId },
            data: { isRead: true }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
