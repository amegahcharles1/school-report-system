import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { current, newPassword, role } = body as { current: string; newPassword: string; role?: string };

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    if (!current) {
      return NextResponse.json({ error: 'Current password / PIN is required' }, { status: 400 });
    }

    // Teacher/Admin password update
    if (role === 'ADMIN' || role === 'TEACHER') {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const valid = await bcrypt.compare(current, user.password);
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: await bcrypt.hash(newPassword, 10),
          mustChangePassword: false,
        },
      });

      return NextResponse.json({ success: true });
    }

    // Student PIN update
    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { id: session.user.id } });
      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      if (!student.pin) {
        return NextResponse.json({ error: 'No PIN is set for this student' }, { status: 400 });
      }

      const valid = await bcrypt.compare(current, student.pin);
      if (!valid) {
        return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 401 });
      }

      await prisma.student.update({
        where: { id: student.id },
        data: { pin: await bcrypt.hash(newPassword, 10) },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
