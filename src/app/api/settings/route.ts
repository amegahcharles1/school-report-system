import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    let settings = await prisma.schoolSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.schoolSettings.create({
        data: { id: 'default' },
      });
    }

    // Get current term and year info
    const currentTerm = settings.currentTermId
      ? await prisma.term.findUnique({ where: { id: settings.currentTermId }, include: { academicYear: true } })
      : null;

    return NextResponse.json({ ...settings, currentTerm });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    // Remove nested relational objects that Prisma upsert will reject
    const { currentTerm, id, createdAt, updatedAt, ...safeData } = body;

    // Convert numeric fields from string if necessary
    if (typeof safeData.caWeight === 'string') safeData.caWeight = parseFloat(safeData.caWeight);
    if (typeof safeData.examWeight === 'string') safeData.examWeight = parseFloat(safeData.examWeight);
    if (typeof safeData.columnWidth === 'string') safeData.columnWidth = parseInt(safeData.columnWidth);
    if (body.columnWidth !== undefined) safeData.columnWidth = parseInt(String(body.columnWidth));

    const settings = await prisma.schoolSettings.upsert({
      where: { id: 'default' },
      update: safeData,
      create: { id: 'default', ...safeData },
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
