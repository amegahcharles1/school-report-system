import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    const whereClause = userRole === 'TEACHER' ? {
      OR: [
        { teacherAssignments: { some: { userId } } },
        { subjectAssignments: { some: { class: { classTeacherId: userId } } } }
      ]
    } : {};

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: { 
        subjectAssignments: { include: { class: true } },
        teacherAssignments: userRole === 'TEACHER' ? { where: { userId } } : false
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(subjects);
  } catch (error) {
    console.error('Subjects GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, isCompulsory, classIds } = body;

    if (!name) {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        isCompulsory: isCompulsory ?? true,
        subjectAssignments: classIds?.length
          ? { create: classIds.map((classId: string) => ({ classId })) }
          : undefined,
      },
      include: { subjectAssignments: { include: { class: true } } },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error('Subjects POST error:', error);
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}
