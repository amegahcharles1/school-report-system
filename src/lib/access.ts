// Access control utilities - determines which classes and subjects a user can access
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type AuthContext = {
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | string;
  userId?: string;
  studentId?: string;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const role = (session.user as any).role as string;
  const userId = session.user.id as string;

  if (role === 'STUDENT') {
    // Student access is based on student identity - expect studentId in session
    const studentId = (session.user as any).studentId as string | undefined;
    return { role, userId, studentId };
  }

  return { role, userId };
}

export async function getAllowedClassIds(): Promise<string[] | null> {
  const auth = await getAuthContext();
  if (!auth) return [];

  // Admins see everything
  if (auth.role === 'ADMIN') return null;

  // Students see their class only
  if (auth.role === 'STUDENT') {
    if (!auth.studentId) return [];
    const student = await prisma.student.findUnique({ where: { id: auth.studentId } });
    return student ? [student.classId] : [];
  }

  // Teachers see classes where they have an assignment (or where they are class teacher)
  const assignments = await prisma.teacherAssignment.findMany({
    where: { userId: auth.userId },
    select: { classId: true },
  });
  const classTeacher = await prisma.class.findMany({
    where: { classTeacherId: auth.userId },
    select: { id: true },
  });

  const allowedIds = new Set<string>();
  assignments.forEach((a) => allowedIds.add(a.classId));
  classTeacher.forEach((c) => allowedIds.add(c.id));

  return Array.from(allowedIds);
}

export async function getAllowedSubjectIds(): Promise<string[] | null> {
  const auth = await getAuthContext();
  if (!auth) return [];
  if (auth.role === 'ADMIN') return null;

  // Students see subjects assigned to their class
  if (auth.role === 'STUDENT') {
    if (!auth.studentId) return [];
    const student = await prisma.student.findUnique({ where: { id: auth.studentId } });
    if (!student) return [];
    const assignments = await prisma.subjectAssignment.findMany({
      where: { classId: student.classId },
      select: { subjectId: true },
    });
    return assignments.map((a) => a.subjectId);
  }

  // Teachers see subjects they are assigned to
  const assignments = await prisma.teacherAssignment.findMany({
    where: { userId: auth.userId },
    select: { subjectId: true },
  });
  return Array.from(new Set(assignments.map((a) => a.subjectId)));
}

export async function isTeacherAssignedTo(userId: string, classId: string, subjectId: string): Promise<boolean> {
  const assignment = await prisma.teacherAssignment.findFirst({
    where: { userId, classId, subjectId },
  });
  if (assignment) return true;

  const cls = await prisma.class.findUnique({ where: { id: classId }, select: { classTeacherId: true } });
  return cls?.classTeacherId === userId;
}
