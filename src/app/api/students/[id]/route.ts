// API: Single Student CRUD
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessClass } from '@/lib/access';

// GET single student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: { class: true, assessments: true, attendances: true },
    });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    if (!(await canAccessClass(student.classId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    return NextResponse.json(student);
  } catch (error) {
    console.error('Student GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 });
  }
}

// PUT update student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const studentExists = await prisma.student.findUnique({ where: { id } });
    if (!studentExists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!(await canAccessClass(studentExists.classId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await request.json();
    const student = await prisma.student.update({
      where: { id },
      data: body,
      include: { class: true },
    });
    return NextResponse.json(student);
  } catch (error) {
    console.error('Student PUT error:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}

// DELETE student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const studentExists = await prisma.student.findUnique({ where: { id } });
    if (!studentExists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!(await canAccessClass(studentExists.classId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
        // Only Admin should do this? For now follow the class access
        await prisma.student.delete({ where: { id } });
    } else {
        await prisma.student.update({
            where: { id },
            data: { isDeleted: true, deletedAt: new Date() }
        });
    }
    return NextResponse.json({ success: true, permanent });
  } catch (error) {
    console.error('Student DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}

// PATCH for specific actions like restoration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json();

    if (action === 'restore') {
      const student = await prisma.student.update({
        where: { id },
        data: { isDeleted: false, deletedAt: null },
        include: { class: true }
      });
      return NextResponse.json(student);
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Student PATCH error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}
