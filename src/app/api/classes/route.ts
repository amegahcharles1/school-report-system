import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAllowedClassIds } from '@/lib/access';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedClassIds = await getAllowedClassIds();

    const whereClause = allowedClassIds !== null
      ? { id: { in: allowedClassIds } }
      : {};

    const classes = await prisma.class.findMany({
      where: whereClause,
      include: { 
        _count: { select: { students: true, subjectAssignments: true } },
        classTeacher: { select: { id: true, name: true } }
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(classes);
  } catch (error) {
    console.error('Classes GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 });
    }

    const cls = await prisma.class.create({
      data: { 
        name,
        classTeacherId: body.classTeacherId || null
      },
      include: { 
        _count: { select: { students: true, subjectAssignments: true } },
        classTeacher: { select: { name: true } }
      },
    });

    return NextResponse.json(cls, { status: 201 });
  } catch (error) {
    console.error('Classes POST error:', error);
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}
