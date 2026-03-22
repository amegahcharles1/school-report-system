// API: Single Class CRUD
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/access';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { name, classTeacherId } = body;
    const cls = await prisma.class.update({
      where: { id },
      data: {
        name,
        classTeacherId: classTeacherId || null
      },
      include: { 
        _count: { select: { students: true, subjectAssignments: true } },
        classTeacher: { select: { name: true } }
      },
    });
    return NextResponse.json(cls);
  } catch (error) {
    console.error('Class PUT error:', error);
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.class.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Class DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }
}
