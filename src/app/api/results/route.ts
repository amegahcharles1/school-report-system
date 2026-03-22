// API: Results with calculations and rankings
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateCAContribution, calculateExamContribution, getGradeAndRemark, calculatePositions, getPositionSuffix } from '@/lib/calculations';
import { canAccessClass } from '@/lib/access';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const termId = searchParams.get('termId');

    if (!classId || !termId) {
      return NextResponse.json({ error: 'classId and termId are required' }, { status: 400 });
    }

    if (!(await canAccessClass(classId))) {
      return NextResponse.json({ error: 'Unauthorized class access' }, { status: 403 });
    }

    const gradeConfigs = await prisma.gradeConfig.findMany();
    const students = await prisma.student.findMany({
      where: { classId },
      include: {
        assessments: {
          where: { termId },
          include: { subject: true },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    const settings = await prisma.schoolSettings.findUnique({ where: { id: 'default' } });
    const caWeight = settings?.caWeight ?? 40;
    const examWeight = settings?.examWeight ?? 60;

    // Calculate results for each student
    const studentResults = students.map((student) => {
      const subjectResults = student.assessments.map((a) => {
        const test1 = a.test1 ?? 0;
        const assignment1 = a.assignment1 ?? 0;
        const test2 = a.test2 ?? 0;
        const assignment2 = a.assignment2 ?? 0;
        const examScore = a.examScore ?? 0;

        const caSubtotal = test1 + assignment1 + test2 + assignment2;
        const caContribution = calculateCAContribution(caSubtotal, caWeight);
        const examContribution = calculateExamContribution(examScore, examWeight);
        const finalTotal = Math.round((caContribution + examContribution) * 100) / 100;
        const { grade, remark } = getGradeAndRemark(finalTotal, gradeConfigs);

        return {
          subjectId: a.subjectId,
          subjectName: a.subject.name,
          test1,
          assignment1,
          test2,
          assignment2,
          caSubtotal,
          caContribution,
          examScore,
          examContribution,
          finalTotal,
          grade,
          remark,
        };
      });

      const totalMarks = subjectResults.reduce((sum, sr) => sum + sr.finalTotal, 0);
      const average = subjectResults.length > 0
        ? Math.round((totalMarks / subjectResults.length) * 100) / 100
        : 0;

      return {
        studentId: student.id,
        studentName: `${student.lastName} ${student.firstName}`,
        subjects: subjectResults,
        totalMarks: Math.round(totalMarks * 100) / 100,
        average,
        position: 0,
        positionSuffix: '',
        grade: '',
        remark: '',
      };
    });

    // Calculate positions based on average
    const positions = calculatePositions(
      studentResults.map((sr) => ({ id: sr.studentId, total: sr.average }))
    );

    // Apply positions and overall grade
    for (const result of studentResults) {
      const pos = positions.get(result.studentId) ?? 0;
      result.position = pos;
      result.positionSuffix = getPositionSuffix(pos);
      const { grade, remark } = getGradeAndRemark(result.average, gradeConfigs);
      result.grade = grade;
      result.remark = remark;
    }

    // Sort by position
    studentResults.sort((a, b) => a.position - b.position);

    // Class statistics
    const averages = studentResults.filter((sr) => sr.subjects.length > 0).map((sr) => sr.average);
    const classStats = {
      classAverage: averages.length > 0
        ? Math.round((averages.reduce((s, a) => s + a, 0) / averages.length) * 100) / 100
        : 0,
      highestAvg: averages.length > 0 ? Math.max(...averages) : 0,
      lowestAvg: averages.length > 0 ? Math.min(...averages) : 0,
      totalStudents: studentResults.length,
      passCount: averages.filter((a) => a >= 50).length,
      failCount: averages.filter((a) => a < 50).length,
    };

    return NextResponse.json({ students: studentResults, classStats });
  } catch (error) {
    console.error('Results error:', error);
    return NextResponse.json({ error: 'Failed to calculate results' }, { status: 500 });
  }
}
