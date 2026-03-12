// Access control utility - determines which classes a user can access
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Charles is the only teacher with multi-class access (JHS 1, 2, 3)
const CHARLES_EMAIL = 'charles@school.com';

export async function getAllowedClassIds(): Promise<string[] | null> {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const email = (session?.user as any)?.email;

  // Admins see everything - return null to mean "no filter"
  if (role === 'ADMIN') return null;

  // Get all classes
  const allClasses = await prisma.class.findMany({ orderBy: { name: 'asc' } });

  // Charles can see all 3 classes
  if (email === CHARLES_EMAIL) {
    return allClasses.map((c: any) => c.id);
  }

  // All other teachers only see JHS 1
  const jhs1 = allClasses.find((c: any) => c.name === 'JHS 1');
  return jhs1 ? [jhs1.id] : [];
}
