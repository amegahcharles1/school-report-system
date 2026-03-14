// API: Marks entry and retrieval
import type { AssessmentAudit, Student } from '@prisma/client';
import type { MarksEntry } from '@/types';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function assertTeacherCanAccess(userId: string, classId: string, subjectId: string) {
  // Allow if the teacher is assigned to this subject/class combination
  const assignment = await prisma.teacherAssignment.findFirst({
    where: { userId, classId, subjectId },
  });

  // Also allow if the teacher is the class teacher (oversight) for that class
  const classTeacher = await prisma.class.findUnique({
    where: { id: classId },
    select: { classTeacherId: true },
  });

  return Boolean(assignment || classTeacher?.classTeacherId === userId);
}

// GET marks for a class/subject/term
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const role = (session.user as any).role;

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const termId = searchParams.get('termId');

    if (!classId || !subjectId || !termId) {
      return NextResponse.json({ error: 'classId, subjectId, and termId are required' }, { status: 400 });
    }

    if (role === 'TEACHER') {
      const allowed = await assertTeacherCanAccess(userId, classId, subjectId);
      if (!allowed) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (role === 'STUDENT') {
      return NextResponse.json({ error: 'Students cannot access marks entry' }, { status: 403 });
    }

    // Get students in the class
    const students = await prisma.student.findMany({
      where: { classId },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    // Get existing assessments
    const assessments = await prisma.assessment.findMany({
      where: { subjectId, termId, studentId: { in: students.map((s: Student) => s.id) } },
      include: {
        audits: {
          include: { modifiedBy: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        }
      }
    });

    const assessmentMap = new Map(assessments.map((a) => [a.studentId, a]));

    const marks = students.map((student: Student) => {
      const assessment = assessmentMap.get(student.id);
      return {
        studentId: student.id,
        studentName: `${student.lastName} ${student.firstName}`,
        test1: assessment?.test1 ?? null,
        assignment1: assessment?.assignment1 ?? null,
        test2: assessment?.test2 ?? null,
        assignment2: assessment?.assignment2 ?? null,
        examScore: assessment?.examScore ?? null,
        status: assessment?.status ?? 'NOT_STARTED',
        id: assessment?.id ?? null,
        audits: assessment?.audits ?? [],
      };
    });

    return NextResponse.json(marks);
  } catch (error) {
    console.error('Marks GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch marks' }, { status: 500 });
  }
}

// POST/PUT save marks (upsert)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await request.json();
    const { classId, subjectId, termId, marks } = body as { classId?: string; subjectId?: string; termId?: string; marks?: any[] };

    if (!classId || !subjectId || !termId || !marks?.length) {
      return NextResponse.json({ error: 'classId, subjectId, termId, and marks are required' }, { status: 400 });
    }

    // Authorization
    if (role === 'STUDENT') {
      return NextResponse.json({ error: 'Students cannot update marks' }, { status: 403 });
    }

    if (role === 'TEACHER') {
      const allowed = await assertTeacherCanAccess(userId, classId, subjectId);
      if (!allowed) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const results = [];
    
    // We want to detect changes out of the incoming payload, thus we cannot just blindly upsert.
    // Fetch all existing assessments for these students in this term/subject to diff against.
    type MarkPayload = MarksEntry & { id?: string; status?: string; audits?: AssessmentAudit[] };

    const studentIds = (marks as MarkPayload[]).map((m) => m.studentId);
    const existingAssessments = await prisma.assessment.findMany({
      where: {
        subjectId, termId, studentId: { in: studentIds }
      }
    });
    
    const existingMap = new Map(existingAssessments.map(a => [a.studentId, a]));

    for (const mark of marks as MarkPayload[]) {
      const existing = existingMap.get(mark.studentId);

      const newTest1 = typeof mark.test1 === 'number' ? mark.test1 : null;
      const newAssignment1 = typeof mark.assignment1 === 'number' ? mark.assignment1 : null;
      const newTest2 = typeof mark.test2 === 'number' ? mark.test2 : null;
      const newAssignment2 = typeof mark.assignment2 === 'number' ? mark.assignment2 : null;
      const newExamScore = typeof mark.examScore === 'number' ? mark.examScore : null;
      
      // Determine completion status based on any mark being entered
      const completionStatus = [newTest1, newAssignment1, newTest2, newAssignment2, newExamScore].some((v) => typeof v === 'number')
        ? 'COMPLETED'
        : 'IN_PROGRESS';

      if (!existing) {
        // Only create assessment if there is some entered data
        if (completionStatus === 'IN_PROGRESS' && [newTest1, newAssignment1, newTest2, newAssignment2, newExamScore].every((v) => v === null)) {
          continue; // nothing entered yet
        }

        // Totally new mark entry
        const createdObj = await prisma.assessment.create({
          data: {
            studentId: mark.studentId, subjectId, termId,
            test1: newTest1, assignment1: newAssignment1,
            test2: newTest2, assignment2: newAssignment2,
            examScore: newExamScore, status: completionStatus,
            createdById: userId, updatedById: userId,
            audits: {
              create: [
                 { field: 'test1', newValue: newTest1, modifiedById: userId, reason: 'Initial Entry' },
                 { field: 'examScore', newValue: newExamScore, modifiedById: userId, reason: 'Initial Entry' }
              ]
            }
          }
        });
        results.push(createdObj);
      } else {
        // Diffing update
        const auditCreates: Array<{
          field: string;
          oldValue?: number;
          newValue?: number;
          modifiedById: string;
          reason: string;
        }> = [];
        
        if (existing.test1 !== newTest1) auditCreates.push({ field: 'test1', oldValue: existing.test1, newValue: newTest1, modifiedById: userId, reason: 'Teacher updated score' });
        if (existing.assignment1 !== newAssignment1) auditCreates.push({ field: 'assignment1', oldValue: existing.assignment1, newValue: newAssignment1, modifiedById: userId, reason: 'Teacher updated score' });
        if (existing.examScore !== newExamScore) auditCreates.push({ field: 'examScore', oldValue: existing.examScore, newValue: newExamScore, modifiedById: userId, reason: 'Teacher updated score' });

        if (auditCreates.length > 0) {
          const updatedObj = await prisma.assessment.update({
            where: { id: existing.id },
            data: {
              test1: newTest1, assignment1: newAssignment1,
              test2: newTest2, assignment2: newAssignment2,
              examScore: newExamScore, status: completionStatus,
              updatedById: userId,
              audits: {
                create: auditCreates
              }
            }
          });
          results.push(updatedObj);
        } else {
          // No changes detected, skip update
        }
      }
    }

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error('Marks POST error:', error);
    return NextResponse.json({ error: 'Failed to save marks' }, { status: 500 });
  }
}
