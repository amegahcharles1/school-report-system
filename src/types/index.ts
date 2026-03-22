// TypeScript type definitions for the school report card system

export interface StudentResult {
  studentId: string;
  studentName: string;
  subjects: SubjectResult[];
  totalMarks: number;
  average: number;
  position: number;
  positionSuffix: string;
  grade: string;
  remark: string;
}

export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  test1: number;
  assignment1: number;
  test2: number;
  assignment2: number;
  caSubtotal: number;
  caContribution: number;
  examScore: number;
  examContribution: number;
  finalTotal: number;
  grade: string;
  remark: string;
}

export interface ReportCardData {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    middleName: string;
    gender: string;
    className: string;
  };
  term: string;
  academicYear: string;
  attendance: {
    totalDays: number;
    daysPresent: number;
    daysAbsent: number;
  };
  subjects: SubjectResult[];
  summary: {
    totalMarks: number;
    average: number;
    position: number;
    positionSuffix: string;
    totalStudents: number;
    highestAvg: number;
    lowestAvg: number;
    classAverage: number;
  };
  school: {
    name: string;
    motto: string;
    address: string;
    logoUrl: string;
    phone: string;
    email: string;
  };
  remarks: {
    teacher: string;
    headteacher: string;
  };
  nextTermDate: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalSubjects: number;
  totalClasses: number;
  bestStudent: { name: string; average: number } | null;
  classAverage: number;
  passRate: number;
  failRate: number;
  gradeDistribution?: { grade: string; count: number }[];
  recentActivity?: any[];
}

export interface MarksEntry {
  studentId: string;
  studentName: string;
  test1: number;
  assignment1: number;
  test2: number;
  assignment2: number;
  examScore: number;
  audits?: any[];
}
