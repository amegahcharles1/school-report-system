// API: Grade configuration CRUD
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/access';

export async function GET() {
  try {
    const grades = await prisma.gradeConfig.findMany({
      orderBy: { minScore: 'desc' },
    });
    return NextResponse.json(grades);
  } catch (error) {
    console.error('Grades GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { minScore, maxScore, grade, remark } = body;
    const config = await prisma.gradeConfig.create({
      data: { minScore, maxScore, grade, remark },
    });
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error('Grades POST error:', error);
    return NextResponse.json({ error: 'Failed to create grade' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { grades } = body;

    // Delete all existing and recreate (bulk update)
    await prisma.gradeConfig.deleteMany();

    const created = await prisma.gradeConfig.createMany({
      data: grades.map((g: { minScore: number; maxScore: number; grade: string; remark: string }) => ({
        minScore: g.minScore,
        maxScore: g.maxScore,
        grade: g.grade,
        remark: g.remark,
      })),
    });

    const updated = await prisma.gradeConfig.findMany({
      orderBy: { minScore: 'desc' },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Grades PUT error:', error);
    return NextResponse.json({ error: 'Failed to update grades' }, { status: 500 });
  }
}
