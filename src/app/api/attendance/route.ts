// API: Attendance management
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const termId = searchParams.get('termId');

    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId;
    if (termId) where.termId = termId;

    const attendance = await prisma.attendance.findMany({
      where,
      include: { student: true, term: true },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Attendance GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, termId, totalDays, daysPresent, daysAbsent } = body;

    const attendance = await prisma.attendance.upsert({
      where: { studentId_termId: { studentId, termId } },
      update: { totalDays, daysPresent, daysAbsent },
      create: { studentId, termId, totalDays, daysPresent, daysAbsent },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Attendance POST error:', error);
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
  }
}
