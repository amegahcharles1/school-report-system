import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/access';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const field = searchParams.get('field');
    const actionType = searchParams.get('actionType');

    const where: any = {};
    if (field) where.field = field;
    if (actionType) where.actionType = actionType;
    if (search) {
      where.OR = [
        { assessment: { student: { firstName: { contains: search, mode: 'insensitive' } } } },
        { assessment: { student: { lastName: { contains: search, mode: 'insensitive' } } } },
        { assessment: { subject: { name: { contains: search, mode: 'insensitive' } } } },
        { modifiedBy: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const audits = await prisma.assessmentAudit.findMany({
      where,
      include: {
        modifiedBy: { select: { name: true, role: true } },
        assessment: {
          include: {
            student: { select: { firstName: true, lastName: true, class: { select: { name: true } } } },
            subject: { select: { name: true } },
            term: { select: { name: true, academicYear: { select: { name: true } } } },
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 200, // Limit for performance
    });

    const formatted = audits.map(a => ({
      id: a.id,
      timestamp: a.createdAt,
      user: a.modifiedBy?.name || 'Unknown',
      action: a.actionType,
      field: a.field,
      oldValue: a.oldValue ?? a.oldValueString,
      newValue: a.newValue ?? a.newValueString,
      student: `${a.assessment.student.lastName} ${a.assessment.student.firstName}`,
      class: a.assessment.student.class.name,
      subject: a.assessment.subject.name,
      term: `${a.assessment.term.name} (${a.assessment.term.academicYear.name})`,
      reason: a.reason,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Audit Logs GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
