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
