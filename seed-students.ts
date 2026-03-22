import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const firstNames = [
  'Kwame', 'Ama', 'Kofi', 'Abena', 'Yaw', 'Yaa', 'Kojo', 'Adwoa', 'Kwasi', 'Akosua',
  'Daniel', 'Emmanuel', 'Mary', 'Joseph', 'Samuel', 'Ruth', 'Ebenezer', 'Grace', 'Mercy', 'David',
  'Michael', 'Sarah', 'Isaac', 'Esther', 'John', 'Martha', 'Peter', 'Hannah', 'Gideon', 'Joy'
];

const lastNames = [
  'Mensah', 'Osei', 'Owusu', 'Boateng', 'Ampofo', 'Agyemang', 'Sarpong', 'Ofori', 'Appiah', 'Asamoah',
  'Frimpong', 'Addai', 'Boakye', 'Danquah', 'Asare', 'Opoku', 'Nkansah', 'Kusi', 'Darko', 'Manu',
  'Amoah', 'Gyasi', 'Aidoo', 'Anson', 'Nkrumah', 'Gyan', 'Boadu', 'Odoom', 'Baah', 'Tetteh'
];

const addresses = [
  'C132/4 Asylum Down, Accra', 'Plot 42, Kumasi', 'House No. 7, Tema', 'Block A, Dansoman',
  'Street 12, Kasoa', 'Flat 4B, East Legon', 'House 90, Madina', 'Avenue 3, Adenta'
];

function getRandomItem(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateAdmissionNumber(classPrefix: string, index: number) {
  return `STU-${classPrefix}-${new Date().getFullYear()}-${String(index).padStart(3, '0')}`;
}

async function main() {
  console.log('Clearing existing students...');
  // Delete all existing students
  await prisma.student.deleteMany();
  console.log('Students cleared.');

  const targetClasses = ['JHS 1', 'JHS 2', 'JHS 3'];

  // Ensure these classes exist
  const classMap = new Map();
  for (const className of targetClasses) {
    let cls = await prisma.class.findUnique({ where: { name: className } });
    if (!cls) {
      console.log(`Creating class ${className}...`);
      cls = await prisma.class.create({ data: { name: className } });
    }
    classMap.set(className, cls.id);
  }

  console.log('Generating sample students...');

  for (const className of targetClasses) {
    const classId = classMap.get(className);
    const prefix = className.replace(' ', '');
    
    // Generate 10 students for this class
    for (let i = 1; i <= 10; i++) {
      const isMale = Math.random() > 0.5;
      const fName = getRandomItem(firstNames);
      const lName = getRandomItem(lastNames);
      const startYear = className === 'JHS 1' ? 2011 : className === 'JHS 2' ? 2010 : 2009;
      
      const dob = getRandomDate(new Date(startYear, 0, 1), new Date(startYear, 11, 31));
      
      await prisma.student.create({
        data: {
          firstName: fName,
          lastName: lName,
          middleName: Math.random() > 0.6 ? getRandomItem(firstNames) : '',
          gender: isMale ? 'Male' : 'Female',
          dateOfBirth: dob.toISOString().split('T')[0],
          admissionNumber: generateAdmissionNumber(prefix, i),
          parentName: `${getRandomItem(firstNames)} ${lName}`,
          parentContact: `02${Math.floor(Math.random() * 90000000 + 10000000)}`,
          address: getRandomItem(addresses),
          status: 'Active',
          classId: classId,
          displayOrder: i
        }
      });
    }
    console.log(`Created 10 students for ${className}`);
  }

  console.log('Database seeded successfully with sample data.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
