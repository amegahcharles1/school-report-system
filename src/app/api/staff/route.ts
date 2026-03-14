import type { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const staff = await prisma.user.findMany({
      where: { role: 'TEACHER' },
      include: {
        teacherAssignments: {
          include: {
            class: { select: { name: true } },
            subject: { select: { name: true } }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Failed to fetch staff:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    type StaffAssignmentPayload = { classId: string; subjectId: string };

    const data = await request.json();
    const { name, email, assignments } = data as { name: string; email: string; assignments?: StaffAssignmentPayload[] }; // assignments: [{classId, subjectId}]

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const defaultPassword = 'Welcome123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'TEACHER',
        teacherAssignments: {
          create: (assignments || []).map((a: StaffAssignmentPayload) => ({
            classId: a.classId,
            subjectId: a.subjectId
          }))
        }
      },
      include: {
        teacherAssignments: {
          include: {
            class: true,
            subject: true
          }
        }
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to create staff member:', error);
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 });
  }
}
