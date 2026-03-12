import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.assessment.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.teacherAssignment.deleteMany()
  await prisma.subjectAssignment.deleteMany()
  await prisma.remarkTemplate.deleteMany()
  await prisma.gradeConfig.deleteMany()
  await prisma.student.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.user.deleteMany()
  await prisma.term.deleteMany()
  await prisma.academicYear.deleteMany()
  await prisma.class.deleteMany()
  await prisma.schoolSettings.deleteMany()

  // Create School Settings
  await prisma.schoolSettings.create({
    data: {
      id: 'default',
      schoolName: 'Bright Future Junior High School',
      schoolMotto: 'Excellence Through Knowledge',
      schoolAddress: '123 Education Avenue, Accra, Ghana',
      schoolPhone: '+233 24 000 0000',
      schoolEmail: 'info@brightfuturejhs.edu.gh',
      nextTermDate: '2026-04-14',
      teacherRemark: '',
      headteacherRemark: '',
    },
  })

  // Create Academic Year
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2025/2026',
      isCurrent: true,
    },
  })

  // Create Terms
  const term1 = await prisma.term.create({
    data: {
      name: 'First Term',
      academicYearId: academicYear.id,
      isCurrent: false,
    },
  })

  const term2 = await prisma.term.create({
    data: {
      name: 'Second Term',
      academicYearId: academicYear.id,
      isCurrent: true,
    },
  })

  await prisma.term.create({
    data: {
      name: 'Third Term',
      academicYearId: academicYear.id,
      isCurrent: false,
    },
  })

  // Update settings with current term/year
  await prisma.schoolSettings.update({
    where: { id: 'default' },
    data: {
      currentTermId: term2.id,
      currentYearId: academicYear.id,
    },
  })

  // Create Classes
  const jhs1 = await prisma.class.create({ data: { name: 'JHS 1' } })
  const jhs2 = await prisma.class.create({ data: { name: 'JHS 2' } })
  const jhs3 = await prisma.class.create({ data: { name: 'JHS 3' } })

  // Exactly 10 Subjects as requested
  const subjectsData = [
    { name: 'English Language', isCompulsory: true },
    { name: 'Mathematics', isCompulsory: true },
    { name: 'Integrated Science', isCompulsory: true },
    { name: 'Social Studies', isCompulsory: true },
    { name: 'RME', isCompulsory: true },
    { name: 'Arabic', isCompulsory: false },
    { name: 'Computing', isCompulsory: true },
    { name: 'Career Technology', isCompulsory: true },
    { name: 'Creative Arts', isCompulsory: true },
    { name: 'Fante', isCompulsory: false }
  ]

  const subjects = []
  for (const sub of subjectsData) {
    subjects.push(await prisma.subject.create({ data: sub }))
  }

  // Assign all subjects to all classes
  for (const cls of [jhs1, jhs2, jhs3]) {
    for (const subject of subjects) {
      await prisma.subjectAssignment.create({
        data: { subjectId: subject.id, classId: cls.id },
      })
    }
  }

  // Users & Authentication Setup
  const adminPassword = await bcrypt.hash('password', 10)
  const teacherPassword = await bcrypt.hash('Welcome123', 10)

  // 1. Admin Account
  await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@school.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  })

  // 2. Staff structure as requested
  const staffStructure = [
    {
      name: 'MR CHARLES',
      email: 'charles@school.com',
      isClassTeacher: true,
      classToOversee: jhs1,
      assignments: [
        { class: jhs1, subjects: ['Mathematics', 'Computing'] },
        { class: jhs2, subjects: ['Mathematics', 'Computing'] },
        { class: jhs3, subjects: ['Mathematics', 'Computing'] },
      ]
    },
    {
      name: 'MR MUNIRU',
      email: 'muniru@school.com',
      assignments: [
        { class: jhs1, subjects: ['Integrated Science', 'Creative Arts'] },
      ]
    },
    {
      name: 'MR CHRISTOPHER',
      email: 'christopher@school.com',
      assignments: [
        { class: jhs1, subjects: ['Fante', 'RME'] },
      ]
    },
    {
      name: 'MADAM RALIYAH',
      email: 'raliyah@school.com',
      assignments: [
        { class: jhs1, subjects: ['English Language'] },
      ]
    },
    {
      name: 'MOHAMMED SAANI',
      email: 'saani@school.com',
      assignments: [
        { class: jhs1, subjects: ['Arabic'] },
      ]
    },
    {
      name: 'MR MICHEAL',
      email: 'micheal@school.com',
      assignments: [
        { class: jhs1, subjects: ['Career Technology', 'Social Studies'] },
      ]
    }
  ]

  for (const s of staffStructure) {
    const user = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        password: teacherPassword,
        role: 'TEACHER'
      }
    })

    if (s.isClassTeacher && s.classToOversee) {
      await prisma.class.update({
        where: { id: s.classToOversee.id },
        data: { classTeacherId: user.id }
      })
    }

    for (const assignment of s.assignments) {
      for (const subName of assignment.subjects) {
        const sub = subjects.find(subj => subj.name === subName)
        if (sub) {
          await prisma.teacherAssignment.create({
            data: {
              userId: user.id,
              classId: assignment.class.id,
              subjectId: sub.id
            }
          })
        }
      }
    }
  }

  // Create Grade Configuration
  const grades = [
    { minScore: 80, maxScore: 100, grade: 'A', remark: 'Excellent' },
    { minScore: 70, maxScore: 79, grade: 'B', remark: 'Very Good' },
    { minScore: 60, maxScore: 69, grade: 'C', remark: 'Good' },
    { minScore: 50, maxScore: 59, grade: 'D', remark: 'Credit' },
    { minScore: 40, maxScore: 49, grade: 'E', remark: 'Pass' },
    { minScore: 0, maxScore: 39, grade: 'F', remark: 'Fail' },
  ]

  for (const grade of grades) {
    await prisma.gradeConfig.create({ data: grade })
  }

  // Create Remark Templates
  const remarkTemplates = [
    { type: 'teacher', minAvg: 80, maxAvg: 100, remark: 'An outstanding performance. Keep up the excellent work!' },
    { type: 'teacher', minAvg: 70, maxAvg: 79, remark: 'A very good performance. Continue to strive for excellence!' },
    { type: 'teacher', minAvg: 60, maxAvg: 69, remark: 'A good performance. There is room for improvement.' },
    { type: 'teacher', minAvg: 50, maxAvg: 59, remark: 'A fair performance. More effort is needed.' },
    { type: 'teacher', minAvg: 40, maxAvg: 49, remark: 'A below average performance. Significant improvement is required.' },
    { type: 'teacher', minAvg: 0, maxAvg: 39, remark: 'A poor performance. Urgent attention and extra support is needed.' },
    { type: 'headteacher', minAvg: 80, maxAvg: 100, remark: 'Exceptional results. The school is proud of you!' },
    { type: 'headteacher', minAvg: 70, maxAvg: 79, remark: 'Very impressive. Keep striving for greatness!' },
    { type: 'headteacher', minAvg: 60, maxAvg: 69, remark: 'Good effort. With more dedication, you can achieve more.' },
    { type: 'headteacher', minAvg: 50, maxAvg: 59, remark: 'Satisfactory. Work harder to improve your grades.' },
    { type: 'headteacher', minAvg: 40, maxAvg: 49, remark: 'Needs improvement. Seek extra help where necessary.' },
    { type: 'headteacher', minAvg: 0, maxAvg: 39, remark: 'Very poor. Immediate remedial action is required.' },
  ]

  for (const template of remarkTemplates) {
    await prisma.remarkTemplate.create({ data: template })
  }

  // Create Students for JHS 1 (Grade 7)
  const jhs1StudentNames = [
    { firstName: 'ABDUL HAKEEM', lastName: '' }, { firstName: 'ABDUL AZIZ', lastName: 'YAHAYA' }, { firstName: 'ABDUL RAHMAN', lastName: 'ABDULLAH' }, { firstName: 'ABDUL RAZAK', lastName: 'SHURAIM' }, { firstName: 'ABASS', lastName: 'ANKRAH' }, { firstName: 'ANDREWS', lastName: 'AYIVI' }, { firstName: 'GODWIN', lastName: 'BESSE' }, { firstName: 'MAWIYA', lastName: 'HARUNA' }, { firstName: 'MOHAMMED ADAM', lastName: 'IBRAHIM' }, { firstName: 'MUJAHIDEEN', lastName: 'IBRAHIM' }, { firstName: 'UMAR AHMED', lastName: 'JELLO' }, { firstName: 'DAANYAL', lastName: 'MARTEY' }, { firstName: 'NURIDEEN AYMAN', lastName: 'MOHAMMED' }, { firstName: 'YUSSIF', lastName: 'MUSAH' }, { firstName: 'BAWA SHANUN', lastName: 'SALIA' }, { firstName: 'ABDUL WADUD', lastName: 'SHUAIB' }, { firstName: 'FAWAZ', lastName: 'SULAIMAN' }, { firstName: 'DRAMANI', lastName: 'WASIU' }, { firstName: 'HAMZA', lastName: 'MOHAMMED' }, { firstName: 'AWAL MUSAH', lastName: 'MUHAMMED' }, { firstName: 'SHAKIRA', lastName: 'ABDUL RAHMNA' }, { firstName: 'ABIGAIL', lastName: 'FUMADOR' }, { firstName: 'YAYRA EMMANUELLA', lastName: 'KORTSU' }, { firstName: 'NORA DELALI', lastName: 'SHEPHERD' }, { firstName: 'EMELIA', lastName: 'DUVOR' }
  ];

  const jhs1Students = await Promise.all(
    jhs1StudentNames.map((s) =>
      prisma.student.create({ data: { firstName: s.firstName, lastName: s.lastName, classId: jhs1.id, gender: 'Unknown' } })
    )
  );

  // Create Students for JHS 2
  const jhs2StudentNames = [
    { firstName: 'TAMIMU TANKO', lastName: 'ADAMU' }, { firstName: 'MOHAMMED AAWUDU', lastName: 'AMINU' }, { firstName: 'UMAR JALLO', lastName: 'ALPHA' }, { firstName: 'ABDUL HAKEEM', lastName: 'ABBAS' }, { firstName: 'ELO DESMOND', lastName: 'DELA' }, { firstName: 'MAHAMA', lastName: 'GAFARU' }, { firstName: 'HAFIZ', lastName: 'HAMZA' }, { firstName: 'A NASIR', lastName: 'KHIDIR' }, { firstName: 'IBRAHIM JIBRIL', lastName: 'KHALID' }, { firstName: 'IBRAHIM', lastName: 'HUZAIFA' }, { firstName: 'MUSAH ZIBO', lastName: 'JAMAL' }, { firstName: 'MUSTAPHA', lastName: 'MUHSSIN' }, { firstName: 'HAFIZ', lastName: 'MOHAMMED' }, { firstName: 'ABDUL RAHMAN', lastName: 'NANOR' }, { firstName: 'GINA', lastName: 'ABBEW' }, { firstName: 'ROBERTA', lastName: 'DARKO' }, { firstName: 'PRECIOUS', lastName: 'DUODO' }, { firstName: 'GRACE', lastName: 'EDORH' }, { firstName: 'HANNAH', lastName: 'KUMI' }, { firstName: 'RAHINA', lastName: 'YUSSIF' }
  ];

  const jhs2Students = await Promise.all(
    jhs2StudentNames.map((s) =>
      prisma.student.create({ data: { firstName: s.firstName, lastName: s.lastName, classId: jhs2.id, gender: 'Unknown' } })
    )
  );

  // Create Students for JHS 3
  const jhs3StudentNames = [
    { firstName: 'ABDUL AZIZ', lastName: 'SULTAN' }, { firstName: 'MOHAMMED', lastName: 'BOADU' }, { firstName: 'ABDUL GAFUR', lastName: 'USMAN' }, { firstName: 'ABDUL RASHID', lastName: 'TAUFIQ' }, { firstName: 'SISSOKO', lastName: 'ABUBAR' }, { firstName: 'ABDUL BASIT', lastName: 'ZAKARIYA' }, { firstName: 'KAMARA', lastName: 'IBRAHIM' }, { firstName: 'MUSAH', lastName: 'ISAK' }, { firstName: 'DAVID', lastName: 'HALLO' }, { firstName: 'HUDU', lastName: 'ISSAKA' }, { firstName: 'QUDUS', lastName: 'JALAL' }, { firstName: 'YAKUBU', lastName: 'MARUF' }, { firstName: 'IDRISS', lastName: 'HAKEEM' }, { firstName: 'INUSAH', lastName: 'MANAF' }, { firstName: 'MUHSIN', lastName: 'OUSMAN' }, { firstName: 'MASAWUDU', lastName: 'MOHAMMED' }, { firstName: 'CLAIRE', lastName: 'BESSE' }, { firstName: 'OLIVIA', lastName: 'EDORH' }, { firstName: 'BLESSING', lastName: 'NYAMAH' }
  ];

  const jhs3Students = await Promise.all(
    jhs3StudentNames.map((s) =>
      prisma.student.create({ data: { firstName: s.firstName, lastName: s.lastName, classId: jhs3.id, gender: 'Unknown' } })
    )
  );

  const allStudents = [...jhs1Students, ...jhs2Students, ...jhs3Students];

  // Wipe out the random sample assessments loop here. 
  // The system should start clean for Second Term so teachers can input real data!
  
  // Create attendance shell records for each student for Second Term
  for (const student of allStudents) {
    await prisma.attendance.create({
      data: {
        studentId: student.id,
        termId: term2.id,
        totalDays: 65,
        daysPresent: 0,
        daysAbsent: 0,
      },
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log(`   - Users: Admin + Teacher accounts created`)
  console.log(`   - Teacher Assignments: Linked to specific classes/subjects`)
  console.log(`   - 3 Classes (JHS 1, JHS 2, JHS 3) with ${subjects.length} Subjects each`)
  console.log(`   - Populated ${allStudents.length} real students across the classes`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
