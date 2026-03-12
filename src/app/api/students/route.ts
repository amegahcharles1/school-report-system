// API: Students CRUD
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAllowedClassIds } from '@/lib/access';

// GET all students (with optional class/search filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const search = searchParams.get('search');

    const allowedClassIds = await getAllowedClassIds();

    const where: Record<string, unknown> = {};

    // Apply class filter - use requested classId only if it's within allowed classes
    if (classId) {
      // If allowedClassIds is null (admin), accept any classId
      // If restricted, check that the requested class is allowed
      if (allowedClassIds !== null && !allowedClassIds.includes(classId)) {
        return NextResponse.json([], ); // Return empty - not authorized for this class
      }
      where.classId = classId;
    } else if (allowedClassIds !== null) {
      // No specific class requested - restrict to allowed classes
      where.classId = { in: allowedClassIds };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      include: { class: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
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
