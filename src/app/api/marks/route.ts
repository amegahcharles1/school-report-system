// API: Marks entry and retrieval
import type { AssessmentAudit, Student } from '@prisma/client';
import type { MarksEntry } from '@/types';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessClass, getAllowedSubjectIds, getSessionUser } from '@/lib/access';


// GET marks for a class/subject/term
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const termId = searchParams.get('termId');

    if (!classId || !subjectId || !termId) {
      return NextResponse.json({ error: 'classId, subjectId, and termId are required' }, { status: 400 });
    }

    if (!(await canAccessClass(classId))) {
      return NextResponse.json({ error: 'Unauthorized class access' }, { status: 403 });
    }

    const allowedSubjects = await getAllowedSubjectIds(classId);
    if (allowedSubjects !== null && !allowedSubjects.includes(subjectId)) {
      return NextResponse.json({ error: 'Unauthorized subject access' }, { status: 403 });
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
        test1: assessment?.test1 ?? 0,
        assignment1: assessment?.assignment1 ?? 0,
        test2: assessment?.test2 ?? 0,
        assignment2: assessment?.assignment2 ?? 0,
        examScore: assessment?.examScore ?? 0,
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
    const user = await getSessionUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = user.id;
    const body = await request.json();
    const { subjectId, termId, marks } = body;

    if (!subjectId || !termId || !marks?.length) {
      return NextResponse.json({ error: 'subjectId, termId, and marks are required' }, { status: 400 });
    }

    // Security check: We need to verify the classId of the students being updated, 
    // and verify the teacher has access to that class and subject.
    const sampleStudentId = marks[0].studentId;
    const studentExists = await prisma.student.findUnique({ where: { id: sampleStudentId }, select: { classId: true } });
    if (!studentExists) {
        return NextResponse.json({ error: 'Invalid students data' }, { status: 400 });
    }

    const classId = studentExists.classId;

    if (!(await canAccessClass(classId))) {
      return NextResponse.json({ error: 'Unauthorized class access' }, { status: 403 });
    }

    const allowedSubjects = await getAllowedSubjectIds(classId);
    if (allowedSubjects !== null && !allowedSubjects.includes(subjectId)) {
      return NextResponse.json({ error: 'Unauthorized subject access' }, { status: 403 });
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

      const newTest1 = mark.test1 ?? 0;
      const newAssignment1 = mark.assignment1 ?? 0;
      const newTest2 = mark.test2 ?? 0;
      const newAssignment2 = mark.assignment2 ?? 0;
      const newExamScore = mark.examScore ?? 0;
      
      // Determine completion status based on actual input
      const completionStatus = (newTest1 > 0 || newAssignment1 > 0 || newTest2 > 0 || newAssignment2 > 0 || newExamScore > 0) ? 'COMPLETED' : 'IN_PROGRESS';

      if (!existing) {
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
                 { field: 'test1', newValue: newTest1, actionType: 'CREATE', modifiedById: userId, reason: 'Initial Entry' },
                 { field: 'assignment1', newValue: newAssignment1, actionType: 'CREATE', modifiedById: userId, reason: 'Initial Entry' },
                 { field: 'test2', newValue: newTest2, actionType: 'CREATE', modifiedById: userId, reason: 'Initial Entry' },
                 { field: 'assignment2', newValue: newAssignment2, actionType: 'CREATE', modifiedById: userId, reason: 'Initial Entry' },
                 { field: 'examScore', newValue: newExamScore, actionType: 'CREATE', modifiedById: userId, reason: 'Initial Entry' }
              ].filter(a => (a.newValue ?? 0) > 0)
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
          actionType: string;
        }> = [];
        
        if (existing.test1 !== newTest1) auditCreates.push({ field: 'test1', oldValue: existing.test1 ?? undefined, newValue: newTest1, actionType: 'UPDATE', modifiedById: userId, reason: 'Teacher updated score' });
        if (existing.assignment1 !== newAssignment1) auditCreates.push({ field: 'assignment1', oldValue: existing.assignment1 ?? undefined, newValue: newAssignment1, actionType: 'UPDATE', modifiedById: userId, reason: 'Teacher updated score' });
        if (existing.test2 !== newTest2) auditCreates.push({ field: 'test2', oldValue: existing.test2 ?? undefined, newValue: newTest2, actionType: 'UPDATE', modifiedById: userId, reason: 'Teacher updated score' });
        if (existing.assignment2 !== newAssignment2) auditCreates.push({ field: 'assignment2', oldValue: existing.assignment2 ?? undefined, newValue: newAssignment2, actionType: 'UPDATE', modifiedById: userId, reason: 'Teacher updated score' });
        if (existing.examScore !== newExamScore) auditCreates.push({ field: 'examScore', oldValue: existing.examScore ?? undefined, newValue: newExamScore, actionType: 'UPDATE', modifiedById: userId, reason: 'Teacher updated score' });

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
        }
      }
    }

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error('Marks POST error:', error);
    return NextResponse.json({ error: 'Failed to save marks' }, { status: 500 });
  }
}
