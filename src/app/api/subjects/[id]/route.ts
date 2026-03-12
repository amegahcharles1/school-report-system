// API: Single Subject CRUD
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, isCompulsory, classIds } = body;

    // Update subject
    const subject = await prisma.subject.update({
      where: { id },
      data: { name, isCompulsory },
    });

    // Update class assignments if provided
    if (classIds !== undefined) {
      await prisma.subjectAssignment.deleteMany({ where: { subjectId: id } });
      if (classIds.length > 0) {
        await prisma.subjectAssignment.createMany({
          data: classIds.map((classId: string) => ({ subjectId: id, classId })),
        });
      }
    }

    const updated = await prisma.subject.findUnique({
      where: { id },
      include: { subjectAssignments: { include: { class: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Subject PUT error:', error);
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.subject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subject DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}
