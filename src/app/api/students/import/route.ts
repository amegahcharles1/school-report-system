// API: Import students from CSV/Excel
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const classId = formData.get('classId') as string;

    if (!file || !classId) {
      return NextResponse.json({ error: 'File and classId are required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const firstName = (row['First Name'] || row['firstName'] || row['first_name'] || '').trim();
      const lastName = (row['Last Name'] || row['lastName'] || row['last_name'] || '').trim();
      const middleName = (row['Middle Name'] || row['middleName'] || row['middle_name'] || '').trim();
      const gender = (row['Gender'] || row['gender'] || 'Male').trim();

      if (!firstName || !lastName) {
        skipped++;
        continue;
      }

      // Check for duplicates
      const existing = await prisma.student.findFirst({
        where: { firstName, lastName, classId },
      });

      if (existing) {
        skipped++;
        errors.push(`${firstName} ${lastName} already exists`);
        continue;
      }

      await prisma.student.create({
        data: { firstName, lastName, middleName, gender, classId },
      });
      imported++;
    }

    return NextResponse.json({ imported, skipped, errors, total: rows.length });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Failed to import students' }, { status: 500 });
  }
}
