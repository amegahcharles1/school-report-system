// API: Terms management
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const terms = await prisma.term.findMany({
      include: { academicYear: true },
      orderBy: [{ academicYear: { name: 'desc' } }, { name: 'asc' }],
    });
    return NextResponse.json(terms);
  } catch (error) {
    console.error('Terms GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch terms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, academicYearId } = body;

    if (!name || !academicYearId) {
      return NextResponse.json({ error: 'Name and academic year are required' }, { status: 400 });
    }

    const term = await prisma.term.create({
      data: { name, academicYearId },
      include: { academicYear: true },
    });

    return NextResponse.json(term, { status: 201 });
  } catch (error) {
    console.error('Terms POST error:', error);
    return NextResponse.json({ error: 'Failed to create term' }, { status: 500 });
  }
}
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, academicYearId, isCurrent } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // If making this one current, unset others in the same academic year
    if (isCurrent) {
      await prisma.term.updateMany({
        where: { NOT: { id }, academicYearId, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const term = await prisma.term.update({
      where: { id },
      data: { name, academicYearId, isCurrent: !!isCurrent },
      include: { academicYear: true },
    });

    return NextResponse.json(term);
  } catch (error) {
    console.error('Term PUT error:', error);
    return NextResponse.json({ error: 'Failed to update term' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.term.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Term deleted successfully' });
  } catch (error) {
    console.error('Term DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete term' }, { status: 500 });
  }
}
