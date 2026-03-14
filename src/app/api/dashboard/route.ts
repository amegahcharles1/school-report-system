// API: Dashboard Statistics
import type { Assessment } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateFinalTotal, getGradeAndRemark } from '@/lib/calculations';
import { getAllowedClassIds } from '@/lib/access';

export async function GET() {
  try {
    const allowedClassIds = await getAllowedClassIds();

    const studentWhere = allowedClassIds !== null ? { classId: { in: allowedClassIds } } : {};

    const totalStudents = await prisma.student.count({ where: studentWhere });
    const totalSubjects = await prisma.subject.count();
    const totalClasses = allowedClassIds !== null
      ? allowedClassIds.length
      : await prisma.class.count();


    // Get current term
    const settings = await prisma.schoolSettings.findUnique({ where: { id: 'default' } });
    const currentTermId = settings?.currentTermId;

    let bestStudent = null;
    let classAverage = 0;
    let passRate = 0;
    let failRate = 0;
    const gradeDistribution = [
      { grade: 'A', count: 0 }, { grade: 'B', count: 0 },
      { grade: 'C', count: 0 }, { grade: 'D', count: 0 },
      { grade: 'E', count: 0 }, { grade: 'F', count: 0 }
    ];

    if (currentTermId) {
      const gradeConfigs = await prisma.gradeConfig.findMany();
      const students = await prisma.student.findMany({ 
        where: studentWhere,
        include: { assessments: { where: { termId: currentTermId } } } 
      });

      const studentAverages: { name: string; average: number }[] = [];

      for (const student of students) {
        if (student.assessments.length === 0) continue;
        const totals = student.assessments.map((a: Assessment) =>
          calculateFinalTotal(a.test1, a.assignment1, a.test2, a.assignment2, a.examScore)
        );
        
        // Track distribution on individual subject totals
        for (const total of totals) {
          const { grade } = getGradeAndRemark(total, gradeConfigs);
          if (grade) {
            const bucket = gradeDistribution.find(g => g.grade === grade);
            if (bucket) bucket.count++;
          }
        }
        
        const avg = totals.reduce((s: number, t: number) => s + t, 0) / totals.length;
        studentAverages.push({ name: `${student.firstName} ${student.lastName}`, average: Math.round(avg * 100) / 100 });
      }

      if (studentAverages.length > 0) {
        studentAverages.sort((a, b) => b.average - a.average);
        bestStudent = studentAverages[0];
        classAverage = Math.round((studentAverages.reduce((s, sa) => s + sa.average, 0) / studentAverages.length) * 100) / 100;

        const passThreshold = 50;
        const passing = studentAverages.filter((s) => s.average >= passThreshold).length;
        passRate = Math.round((passing / studentAverages.length) * 100);
        failRate = 100 - passRate;
      }
    }
    
    // Fetch recent activity
    const recentActivity = await prisma.assessmentAudit.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        modifiedBy: { select: { name: true, role: true } },
        assessment: { 
          include: { student: { select: { firstName: true, lastName: true } }, subject: { select: { name: true } } }
        }
      }
    });

    return NextResponse.json({
      totalStudents,
      totalSubjects,
      totalClasses,
      bestStudent,
      classAverage,
      passRate,
      failRate,
      gradeDistribution,
      recentActivity
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
