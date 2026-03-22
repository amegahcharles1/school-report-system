import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/access';

export async function GET() {
  try {
    const academicYears = await prisma.academicYear.findMany({
      include: {
        terms: true,
      },
      orderBy: {
        name: 'desc',
      },
    });
    return NextResponse.json(academicYears);
  } catch (error) {
    console.error('Academic Years GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch academic years' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { name, isCurrent } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // If making this one current, unset others
    if (isCurrent) {
      await prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const academicYear = await prisma.academicYear.create({
      data: { name, isCurrent: !!isCurrent },
    });

    return NextResponse.json(academicYear, { status: 201 });
  } catch (error) {
    console.error('Academic Year POST error:', error);
    return NextResponse.json({ error: 'Failed to create academic year' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, name, isCurrent } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // If making this one current, unset others
    if (isCurrent) {
      await prisma.academicYear.updateMany({
        where: { NOT: { id }, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const academicYear = await prisma.academicYear.update({
      where: { id },
      data: { name, isCurrent: !!isCurrent },
    });

    return NextResponse.json(academicYear);
  } catch (error) {
    console.error('Academic Year PUT error:', error);
    return NextResponse.json({ error: 'Failed to update academic year' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.academicYear.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Academic year deleted successfully' });
  } catch (error) {
    console.error('Academic Year DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete academic year' }, { status: 500 });
  }
}
