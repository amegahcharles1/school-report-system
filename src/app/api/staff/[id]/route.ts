import type { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Admin guard
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'ADMIN') return false;
  return true;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    type StaffAssignmentPayload = { classId: string; subjectId: string };

    const { id } = await params;
    const body = await request.json();
    const { name, email, newPassword, assignments } = body as { name: string; email: string; newPassword?: string; assignments?: StaffAssignmentPayload[] };

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Check email uniqueness (exclude current user)
    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json({ error: 'That email is already used by another account' }, { status: 400 });
    }

    // Build update data
    const updateData: Prisma.UserUpdateInput = { name, email };
    if (newPassword && newPassword.trim().length >= 6) {
      updateData.password = await bcrypt.hash(newPassword.trim(), 10);
      // Force the user to update password after an admin reset or manual update
      updateData.mustChangePassword = true;
    }

    // Update user details
    await prisma.user.update({ where: { id }, data: updateData });

    // Reassign subjects/classes if provided
    if (Array.isArray(assignments)) {
      // Delete all old assignments then create new ones
      await prisma.teacherAssignment.deleteMany({ where: { userId: id } });
      if (assignments.length > 0) {
        await prisma.teacherAssignment.createMany({
          data: assignments.map((a: StaffAssignmentPayload) => ({
            userId: id,
            classId: a.classId,
            subjectId: a.subjectId,
          })),
        });
      }
    }

    // Return updated user
    const updated = await prisma.user.findUnique({
      where: { id },
      include: {
        teacherAssignments: {
          include: {
            class: { select: { name: true } },
            subject: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update staff member:', error);
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    // Check if user exists and is a teacher (security)
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { role: true, name: true }
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    if (userToDelete.role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot delete administrator accounts' }, { status: 400 });
    }

    // Manual cleanup of assignments just to be safe, although schema has cascade
    await prisma.teacherAssignment.deleteMany({ where: { userId: id } });
    
    // Clear class oversight references
    await prisma.class.updateMany({
      where: { classTeacherId: id },
      data: { classTeacherId: null }
    });

    // Final deletion
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `Teacher ${userToDelete.name} removed successfully` });
  } catch (error: unknown) {
    console.error('Failed to delete teacher:', error);
    // Explicitly handle foreign key errors if they still occur
    const err = error as { code?: string };
    if (err?.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Cannot delete teacher because they have associated records (marks, etc.) that cannot be removed.' 
      }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete teacher account' }, { status: 500 });
  }
}
