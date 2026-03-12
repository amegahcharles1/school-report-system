// API: Students CRUD
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAllowedClassIds } from '@/lib/access';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const CHARLES_EMAIL = 'charles@school.com';

// GET all students (with optional class/search filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const search = searchParams.get('search');

    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const email = (session?.user as any)?.email;

    const allowedClassIds = await getAllowedClassIds();

    const where: Record<string, unknown> = {};

    if (classId) {
      if (allowedClassIds !== null && !allowedClassIds.includes(classId)) {
        return NextResponse.json([]);
      }
      where.classId = classId;
    } else if (allowedClassIds !== null) {
      where.classId = { in: allowedClassIds };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    // Admin and Charles see book order; all other teachers see A-Z
    const useBookOrder = role === 'ADMIN' || email === CHARLES_EMAIL;
    const orderBy = useBookOrder
      ? [{ displayOrder: 'asc' as const }, { lastName: 'asc' as const }, { firstName: 'asc' as const }]
      : [{ lastName: 'asc' as const }, { firstName: 'asc' as const }];

    const students = await prisma.student.findMany({
      where,
      include: { class: true },
      orderBy,
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error('Students GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}



// POST create student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, middleName, gender, dateOfBirth, classId } = body;

    if (!firstName || !lastName || !classId) {
      return NextResponse.json({ error: 'First name, last name, and class are required' }, { status: 400 });
    }

    // Check for duplicate
    const existing = await prisma.student.findFirst({
      where: { firstName, lastName, classId },
    });
    if (existing) {
      return NextResponse.json({ error: 'A student with this name already exists in this class' }, { status: 409 });
    }

    const student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        middleName: middleName || '',
        gender: gender || 'Male',
        dateOfBirth: dateOfBirth || '',
        classId,
      },
      include: { class: true },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error('Students POST error:', error);
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}
