// API: Report Card data for a single student
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  calculateFinalTotal, 
  getGradeAndRemark, 
  calculatePositions, 
  getPositionSuffix, 
  generateAutoRemark 
} from '@/lib/calculations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const { searchParams } = new URL(request.url);
    const termId = searchParams.get('termId');

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: { include: { classTeacher: true } } },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get settings
    const settings = await prisma.schoolSettings.findUnique({ where: { id: 'default' } });
    const actualTermId = termId || settings?.currentTermId;

    if (!actualTermId) {
      return NextResponse.json({ error: 'No term selected' }, { status: 400 });
    }

    // Configuration weights
    const caWeight = settings?.caWeight ?? 40;
    const examWeight = settings?.examWeight ?? 60;

    // Get term and academic year info
    const term = await prisma.term.findUnique({
      where: { id: actualTermId },
      include: { academicYear: true },
    });

    // Get grade configs
    const gradeConfigs = await prisma.gradeConfig.findMany();

    // Get remark templates
    const remarkTemplates = await prisma.remarkTemplate.findMany();

    // Get attendance
    const attendance = await prisma.attendance.findFirst({
      where: { studentId, termId: actualTermId },
    });

    // Get this student's assessments
    const assessments = await prisma.assessment.findMany({
      where: { studentId, termId: actualTermId },
      include: { subject: true },
    });

    // Calculate subject results using dynamic weights
    const subjectResults = assessments.map((a) => {
      const caSubtotal = a.test1 + a.assignment1 + a.test2 + a.assignment2;
      const caContribution = Math.round(caSubtotal * (caWeight / 100) * 100) / 100;
      const examContribution = Math.round(a.examScore * (examWeight / 100) * 100) / 100;
      const finalTotal = Math.round((caContribution + examContribution) * 100) / 100;
      const { grade, remark } = getGradeAndRemark(finalTotal, gradeConfigs);

      return {
        subjectId: a.subjectId,
        subjectName: a.subject.name,
        test1: a.test1,
        assignment1: a.assignment1,
        test2: a.test2,
        assignment2: a.assignment2,
        caSubtotal,
        caWeight,
        caContribution,
        examScore: a.examScore,
        examWeight,
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

    // Calculate position among all students in same class
    const allStudents = await prisma.student.findMany({
      where: { classId: student.classId },
      include: { assessments: { where: { termId: actualTermId } } },
    });

    const studentAverages = allStudents.map((s) => {
      const totals = s.assessments.map((a) =>
        calculateFinalTotal(a.test1, a.assignment1, a.test2, a.assignment2, a.examScore, caWeight, examWeight)
      );
      const avg = totals.length > 0 ? totals.reduce((sum, t) => sum + t, 0) / totals.length : 0;
      return { id: s.id, total: Math.round(avg * 100) / 100 };
    });

    const positions = calculatePositions(studentAverages);
    const position = positions.get(studentId) ?? 0;
    const allAverages = studentAverages.map((sa) => sa.total);

    // Auto-generate remarks
    const teacherRemarks = remarkTemplates.filter((r) => r.type === 'teacher');
    const headteacherRemarks = remarkTemplates.filter((r) => r.type === 'headteacher');

    let teacherRemark = generateAutoRemark(average);
    let headteacherRemark = '';

    for (const tmpl of teacherRemarks) {
      if (average >= tmpl.minAvg && average <= tmpl.maxAvg) {
        teacherRemark = tmpl.remark;
        break;
      }
    }

    for (const tmpl of headteacherRemarks) {
      if (average >= tmpl.minAvg && average <= tmpl.maxAvg) {
        headteacherRemark = tmpl.remark;
        break;
      }
    }

    const reportCard = {
      reportTitle: settings?.reportTitle || 'STUDENT PROGRESS REPORT',
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: student.middleName,
        gender: student.gender,
        className: student.class.name,
        classTeacherKey: student.class.classTeacher?.name || 'NAME NOT ASSIGNED',
      },
      term: term?.name ?? '',
      academicYear: term?.academicYear?.name ?? '',
      attendance: {
        totalDays: attendance?.totalDays ?? 0,
        daysPresent: attendance?.daysPresent ?? 0,
        daysAbsent: attendance?.daysAbsent ?? 0,
      },
      subjects: subjectResults,
      summary: {
        showPositions: settings?.showPositions ?? true,
        showAverages: settings?.showAverages ?? true,
        totalMarks: Math.round(totalMarks * 100) / 100,
        average,
        position,
        positionSuffix: getPositionSuffix(position),
        totalStudents: allStudents.length,
        highestAvg: allAverages.length > 0 ? Math.max(...allAverages) : 0,
        lowestAvg: allAverages.length > 0 ? Math.min(...allAverages) : 0,
        classAverage: allAverages.length > 0
          ? Math.round((allAverages.reduce((s, a) => s + a, 0) / allAverages.length) * 100) / 100
          : 0,
      },
      school: {
        name: settings?.schoolName ?? 'MY SCHOOL',
        motto: settings?.schoolMotto ?? '',
        address: settings?.schoolAddress ?? '',
        logoUrl: settings?.logoUrl ?? '',
        phone: settings?.schoolPhone ?? '',
        email: settings?.schoolEmail ?? '',
        headTeacherName: settings?.headTeacherName || 'THE HEADTEACHER',
        test1Label: settings?.test1Label || 'Test 1',
        assignment1Label: settings?.assignment1Label || 'Assign 1',
        test2Label: settings?.test2Label || 'Test 2',
        assignment2Label: settings?.assignment2Label || 'Assign 2',
        examLabel: settings?.examLabel || 'Exam',
        studentLabel: settings?.studentLabel || 'Student Name',
        subjectLabel: settings?.subjectLabel || 'Subject of Learning',
        caSubtotalLabel: settings?.caSubtotalLabel || 'CA Subtotal',
        caWeightLabel: settings?.caWeightLabel || 'CA',
        examWeightLabel: settings?.examWeightLabel || 'Exam',
        finalTotalLabel: settings?.finalTotalLabel || 'Final Total',
        gradeLabel: settings?.gradeLabel || 'Grade',
        remarksLabel: settings?.remarksLabel || 'Remarks / Comment',
        classTeacherLabel: settings?.classTeacherLabel || 'Class Teacher',
        headTeacherLabel: settings?.headTeacherLabel || 'Head Teacher',
        totalMarksLabel: settings?.totalMarksLabel || 'Total Marks',
        averageLabel: settings?.averageLabel || 'Average %',
        positionLabel: settings?.positionLabel || 'Class Position',
        classAverageLabel: settings?.classAverageLabel || 'Class Average',
        highestScoreLabel: settings?.highestScoreLabel || 'Highest Score',
        lowestScoreLabel: settings?.lowestScoreLabel || 'Lowest Score',
        caWeight: settings?.caWeight || 40,
        examWeight: settings?.examWeight || 60,
      },
      remarks: {
        teacher: teacherRemark,
        headteacher: headteacherRemark,
      },
      footerMessage: settings?.reportCardMessage ?? '',
    };

    return NextResponse.json(reportCard);
  } catch (error) {
    console.error('Report card error:', error);
    return NextResponse.json({ error: 'Failed to generate report card' }, { status: 500 });
  }
}
