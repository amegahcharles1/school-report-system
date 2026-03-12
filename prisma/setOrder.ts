// Script to set the displayOrder for JHS 1 students based on the physical book order
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// The exact order from the physical book (as FIRSTNAME LASTNAME)
const JHS1_ORDER = [
  { firstName: 'HABIB', lastName: 'ABDUL' },       // ABDUL HAKEEM HABIB -> map to stored names
  // We'll match by full name display
];

// The list in display format "FIRSTNAME MIDDLENAME LASTNAME" or "FIRSTNAME LASTNAME"
// Stored in DB as: firstName + lastName
// Let's match by combining and doing case-insensitive search

const ORDERED_NAMES = [
  'ABDUL HAKEEM HABIB',
  'ABDUL AZIZ YAHAYA',
  'ABDUL RAHMAN ABDULLAH',
  'ABDUL RAZAK SHURAIM',
  'ANKRAH ABASS',
  'AYIVI ANDREWS',
  'BESSE GODWIN',
  'HARUNA MAWIYA',
  'IBRAHIM MOHAMMED ADAM',
  'IBRAHIM MUJAHIDEEN',
  'JELLO UMAR AHMED',
  'MARTEY DAANYAL',
  'MOHAMMED NURIDEEN AYMAN',
  'MUSAH YUSSIF',
  'SALIA BAWA SHANUN',
  'SHUAIB ABDUL WADUD',
  'SULAIMAN FAWAZ',
  'WASIU DRAMANI',
  'MOHAMMED HAMZA',
  'MUHAMMED AWAL MUSAH',
  'ABDUL RAHMNA SHAKIRA',
  'FUMADOR ABIGAIL',
  'KORTSU YAYRA EMMANUELLA',
  'SHEPHERD NORA DELALI',
  'DUVOR EMELIA',
];

async function setJHS1Order() {
  console.log('🔍 Fetching JHS 1 class...');
  
  const jhs1Class = await prisma.class.findFirst({
    where: { name: 'JHS 1' },
  });

  if (!jhs1Class) {
    console.error('❌ JHS 1 class not found!');
    return;
  }

  const students = await prisma.student.findMany({
    where: { classId: jhs1Class.id },
  });

  console.log(`📚 Found ${students.length} students in JHS 1`);

  for (let i = 0; i < ORDERED_NAMES.length; i++) {
    const targetName = ORDERED_NAMES[i].toUpperCase();
    
    // Try to find matching student
    const match = students.find((s) => {
      const full1 = `${s.firstName} ${s.lastName}`.toUpperCase().trim();
      const full2 = `${s.lastName} ${s.firstName}`.toUpperCase().trim();
      const full3 = `${s.firstName} ${s.middleName} ${s.lastName}`.toUpperCase().trim().replace(/\s+/g, ' ');
      
      return (
        full1 === targetName ||
        full2 === targetName ||
        full3 === targetName ||
        full1.includes(targetName) ||
        targetName.includes(full1) ||
        targetName.includes(full2)
      );
    });

    if (match) {
      await prisma.student.update({
        where: { id: match.id },
        data: { displayOrder: i + 1 },
      });
      console.log(`✅ [${i + 1}] ${targetName} → ID: ${match.id} (${match.firstName} ${match.lastName})`);
    } else {
      console.warn(`⚠️  [${i + 1}] NOT FOUND: ${targetName}`);
      // Print all students so user can check
    }
  }

  // Print unmatched students
  const matchedIds = new Set<string>();
  for (let i = 0; i < ORDERED_NAMES.length; i++) {
    const targetName = ORDERED_NAMES[i].toUpperCase();
    const match = students.find((s) => {
      const full1 = `${s.firstName} ${s.lastName}`.toUpperCase().trim();
      const full2 = `${s.lastName} ${s.firstName}`.toUpperCase().trim();
      return full1 === targetName || full2 === targetName || targetName.includes(full1) || targetName.includes(full2);
    });
    if (match) matchedIds.add(match.id);
  }

  const unmatched = students.filter(s => !matchedIds.has(s.id));
  if (unmatched.length > 0) {
    console.log('\n📋 Students in DB (not matched):');
    unmatched.forEach(s => console.log(`   - "${s.firstName} ${s.lastName}" (stored format)`));
  }

  console.log('\n✅ Done! JHS 1 display order has been set.');
  await prisma.$disconnect();
}

setJHS1Order().catch(console.error);
