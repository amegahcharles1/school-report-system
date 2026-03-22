import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type UserSession = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export async function getSessionUser(): Promise<UserSession | null> {
  const session = await getServerSession(authOptions);
  return session?.user as UserSession | null;
}

/**
 * Throws an error if the user is not an ADMIN. 
 * Use in API routes wrapped in try-catch.
 */
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error('UNAUTHORIZED_ADMIN');
  }
  return user;
}

/**
 * Returns null if ADMIN (has access to all classes).
 * Returns array of class IDs if TEACHER (has access to assigned classes).
 * Returns empty array if not logged in.
 */
export async function getAllowedClassIds(): Promise<string[] | null> {
  const user = await getSessionUser();
  if (!user) return [];

  if (user.role === 'ADMIN') return null; // Admin sees everything

  // Teacher sees classes they are the classTeacher for
  const managedClasses = await prisma.class.findMany({
    where: { classTeacherId: user.id },
    select: { id: true }
  });

  // Teacher sees classes they have assignments for
  const assignments = await prisma.teacherAssignment.findMany({
    where: { userId: user.id },
    select: { classId: true }
  });

  const classIds = new Set([
    ...managedClasses.map(c => c.id),
    ...assignments.map(a => a.classId)
  ]);

  return Array.from(classIds);
}

/**
 * Returns null if ADMIN (has access to all subjects).
 * Returns array of subject IDs if TEACHER (filtered by optional classId).
 */
export async function getAllowedSubjectIds(classId?: string): Promise<string[] | null> {
  const user = await getSessionUser();
  if (!user) return [];

  if (user.role === 'ADMIN') return null; // Admin sees everything

  const where: any = { userId: user.id };
  if (classId) {
    where.classId = classId;
  }

  const assignments = await prisma.teacherAssignment.findMany({
    where,
    select: { subjectId: true }
  });

  const subjectIds = new Set(assignments.map(a => a.subjectId));
  return Array.from(subjectIds);
}

/**
 * Checks if a teacher can access/modify a specific student's marks
 */
export async function canAccessClass(classId: string): Promise<boolean> {
  const allowed = await getAllowedClassIds();
  if (allowed === null) return true; // Admin
  return allowed.includes(classId);
}
