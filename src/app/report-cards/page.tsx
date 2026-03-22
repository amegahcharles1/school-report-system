'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, Search, Layout, ChevronLeft, ChevronRight, Loader2, BookOpen, GraduationCap, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function ReportCardsPage() {
  const { data: session } = useSession();
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  // 1. Fetch Classes
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await fetch('/api/classes');
      return res.json();
    }
  });

  // 2. Fetch Terms
  const { data: terms = [] } = useQuery({
    queryKey: ['terms'],
    queryFn: async () => {
      const res = await fetch('/api/terms');
      return res.json();
    }
  });

  // 3. Fetch Students (Dependent on Class)
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      const res = await fetch(`/api/students?classId=${selectedClass}`);
      return res.json();
    },
    enabled: !!selectedClass
  });

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0].id);
  }, [classes, selectedClass]);

  useEffect(() => {
    if (terms.length > 0 && !selectedTerm) {
      const activeTerm = terms.find((t: any) => t.isCurrent);
      setSelectedTerm(activeTerm ? activeTerm.id : terms[0].id);
    }
  }, [terms, selectedTerm]);

  useEffect(() => {
    if (students.length > 0 && !selectedStudent) setSelectedStudent(students[0].id);
    else if (students.length === 0 && selectedStudent) setSelectedStudent('');
  }, [students, selectedStudent]);

  // 4. Fetch Report Data (Dependent on Student and Term)
  const { data: reportData, isLoading: isLoadingReport, isFetching: isFetchingReport } = useQuery({
    queryKey: ['report-card', selectedStudent, selectedTerm],
    queryFn: async () => {
      if (!selectedStudent || !selectedTerm) return null;
      const res = await fetch(`/api/report-card/${selectedStudent}?termId=${selectedTerm}`);
      if (!res.ok) throw new Error('Failed to generate report');
      return res.json();
    },
    enabled: !!selectedStudent && !!selectedTerm,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast.success('Preparing professional PDF layout...');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const loading = isLoadingReport || isFetchingReport;

  return (
    <div className="space-y-8 animate-fade-in relative min-h-screen pb-20">
      {/* Selection Toolbar - Hidden when printing */}
      <div className="no-print space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <FileText className="w-8 h-8 text-indigo-600" /> Assessment Vault
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Generate and curate professional institutional progress reports</p>
          </div>
          {reportData && (
            <div className="flex gap-3">
              <Button onClick={handlePrint} variant="outline" icon={<Printer className="w-4 h-4" />}>
                Print Document
              </Button>
              <Button 
                onClick={handleDownloadPDF} 
                variant="premium" 
                className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10"
                icon={<Download className="w-4 h-4" />}
                isLoading={loading}
              >
                Export PDF
              </Button>
            </div>
          )}
        </div>

        <div className="premium-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
              <BookOpen className="w-3 h-3" /> Class Segment
            </label>
            <select 
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)} 
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-bold text-sm appearance-none"
            >
              {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Academic Phase
            </label>
            <select 
              value={selectedTerm} 
              onChange={e => setSelectedTerm(e.target.value)} 
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-bold text-sm appearance-none"
            >
              {terms.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.academicYear?.name})</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
              <GraduationCap className="w-3 h-3" /> Candidate Selection
            </label>
            <select 
              value={selectedStudent} 
              onChange={e => setSelectedStudent(e.target.value)} 
              disabled={isLoadingStudents}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-bold text-sm appearance-none disabled:opacity-50"
            >
              {isLoadingStudents ? (
                <option>Loading roster...</option>
              ) : students.length === 0 ? (
                <option value="">No students in segment</option>
              ) : (
                students.map((s: any) => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>)
              )}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="no-print mt-20 text-center flex flex-col items-center justify-center">
          <div className="bg-white text-black p-10 md:p-14 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] rounded-sm max-w-[210mm] w-full mx-auto animate-pulse flex flex-col gap-6">
            <div className="h-16 bg-slate-100 rounded-md w-3/4 mx-auto mb-4"></div>
            <div className="h-6 bg-slate-100 rounded-md w-1/2 mx-auto mb-10"></div>
            
            <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-10 py-8 px-10 bg-slate-50 border-x-2 border-slate-200 rounded-sm">
              <div className="h-5 bg-slate-200 rounded w-full"></div>
              <div className="h-5 bg-slate-200 rounded w-full"></div>
              <div className="h-5 bg-slate-200 rounded w-full"></div>
              <div className="h-5 bg-slate-200 rounded w-full"></div>
            </div>
            
            <div className="h-64 bg-slate-50 rounded-md w-full mb-10"></div>
            
            <div className="flex gap-8">
              <div className="flex-1 h-32 bg-slate-100 rounded-md"></div>
              <div className="flex-1 h-32 bg-slate-100 rounded-md"></div>
            </div>
          </div>
        </div>
      ) : reportData ? (
        <div id="report-card" className="bg-white text-black p-10 md:p-14 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] rounded-sm max-w-[210mm] mx-auto min-h-[297mm] print:shadow-none print:m-0 print:p-0 print:max-w-full font-serif relative">
          
          {/* Header */}
          <div className="text-center border-b-[6px] border-indigo-900 pb-8 mb-10">
            <h1 className="text-4xl font-black uppercase text-indigo-900 tracking-widest leading-tight">
              {reportData.school.name}
            </h1>
            <p className="text-xl italic text-slate-800 mt-2 font-medium tracking-wide">
              {reportData.school.motto}
            </p>
            <p className="text-sm text-slate-600 mt-2 font-sans font-semibold">
              {reportData.school.address} | TEL: {reportData.school.phone}
            </p>
            
            <div className="mt-8 relative inline-block">
              <div className="absolute inset-0 bg-indigo-900 skew-x-[-12deg] -z-10"></div>
              <div className="text-white px-10 py-3 uppercase tracking-[0.2em] font-black text-lg">
                {reportData.reportTitle}
              </div>
            </div>
          </div>

          {/* Student Info Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-10 py-8 px-10 bg-slate-50 border-x-2 border-slate-200 rounded-sm font-sans">
            <div className="flex border-b border-slate-300 pb-1">
              <span className="font-black w-36 uppercase text-[10px] text-indigo-900 flex items-center">{reportData.school.studentLabel || 'Student Name'}:</span> 
              <span className="font-bold text-lg uppercase flex-1 truncate">{reportData.student.lastName}, {reportData.student.firstName}</span>
            </div>
            <div className="flex border-b border-slate-300 pb-1">
              <span className="font-black w-36 uppercase text-[10px] text-indigo-900 flex items-center">Academic Year:</span> 
              <span className="font-bold text-lg flex-1">{reportData.academicYear}</span>
            </div>
            <div className="flex border-b border-slate-300 pb-1">
              <span className="font-black w-36 uppercase text-[10px] text-indigo-900 flex items-center">Current Class:</span> 
              <span className="font-bold text-lg flex-1 text-indigo-800">{reportData.student.className}</span>
            </div>
            <div className="flex border-b border-slate-300 pb-1">
              <span className="font-black w-36 uppercase text-[10px] text-indigo-900 flex items-center">Academic Term:</span> 
              <span className="font-bold text-lg flex-1">{reportData.term}</span>
            </div>
            
            {reportData.summary.showAttendance && (
               <>
                <div className="flex border-b border-slate-300 pb-1">
                  <span className="font-black w-36 uppercase text-[10px] text-indigo-900 flex items-center">Days Present:</span> 
                  <span className="font-bold text-lg flex-1 text-emerald-700">{reportData.attendance.daysPresent} <span className="text-xs font-normal text-slate-500">out of {reportData.attendance.totalDays}</span></span>
                </div>
                <div className="flex border-b border-slate-300 pb-1">
                  <span className="font-black w-36 uppercase text-[10px] text-indigo-900 flex items-center">Days Absent:</span> 
                  <span className="font-bold text-lg flex-1 text-rose-700">{reportData.attendance.daysAbsent}</span>
                </div>
               </>
            )}
          </div>

          {/* Marks Table */}
          <div className="mb-10 font-sans overflow-x-auto">
            <table className="w-full border-collapse min-w-full">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="border-2 border-slate-800 px-4 py-4 text-left uppercase text-[11px] font-black w-1/3">{reportData.school.subjectLabel || 'Subject of Learning'}</th>
                  <th className="border-2 border-slate-800 px-2 py-4 text-center uppercase text-[11px] font-black">{reportData.school.caWeightLabel || 'CA'}<br/><span className="text-[9px] font-normal opacity-70">({reportData.school.caWeight || 40}%)</span></th>
                  <th className="border-2 border-slate-800 px-2 py-4 text-center uppercase text-[11px] font-black">{reportData.school.examLabel || 'Exam'}<br/><span className="text-[9px] font-normal opacity-70">({reportData.school.examWeight || 60}%)</span></th>
                  <th className="border-2 border-slate-800 px-2 py-4 text-center uppercase text-[11px] font-black bg-slate-700">{reportData.school.finalTotalLabel || 'Total'}<br/><span className="text-[9px] font-normal opacity-70">(100%)</span></th>
                  <th className="border-2 border-slate-800 px-2 py-4 text-center uppercase text-[11px] font-black">{reportData.school.gradeLabel || 'Grade'}</th>
                  <th className="border-2 border-slate-800 px-4 py-4 text-left uppercase text-[11px] font-black">{reportData.school.remarksLabel || 'Remarks / Comment'}</th>
                </tr>
              </thead>
              <tbody className="border-2 border-slate-800">
                {reportData.subjects.map((s: any, i: number) => (
                  <tr key={s.subjectId} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-300 px-4 py-3 font-bold text-sm text-slate-900">{s.subjectName}</td>
                    <td className="border border-slate-300 px-2 py-3 text-center text-sm font-medium">{s.caContribution}</td>
                    <td className="border border-slate-300 px-2 py-3 text-center text-sm font-medium">{s.examContribution}</td>
                    <td className="border border-slate-300 px-2 py-3 text-center font-black text-sm bg-slate-100">{s.finalTotal}</td>
                    <td className="border border-slate-300 px-2 py-3 text-center font-black text-indigo-700 text-base">{s.grade}</td>
                    <td className="border border-slate-300 px-4 py-3 text-xs italic font-medium text-slate-600">{s.remark}</td>
                  </tr>
                ))}
                {reportData.subjects.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-medium italic">No assessment data compiled for this term.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Performance Summary */}
          <div className="flex flex-col md:flex-row gap-8 mb-10 font-sans">
            <div className="flex-1 border-2 border-slate-200 rounded-sm p-6 bg-slate-50 shadow-inner">
              <h3 className="uppercase text-[11px] font-black text-slate-500 mb-6 border-b-2 border-slate-200 pb-2 flex justify-between">
                Academic Performance <span>Final Result</span>
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-white border border-slate-200 rounded shadow-sm">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{reportData.school.totalMarksLabel || 'Total Marks'}</div>
                  <div className="text-2xl font-black text-slate-800">{reportData.summary.totalMarks}</div>
                </div>
                <div className="text-center p-4 bg-white border border-slate-200 rounded shadow-sm">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{reportData.school.averageLabel || 'Average %'}</div>
                  <div className="text-2xl font-black text-indigo-700">{reportData.summary.average}</div>
                </div>
                {reportData.summary.showPositions && (
                  <div className="text-center p-4 bg-indigo-900 rounded col-span-2 shadow-lg">
                    <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.2em] mb-1">{reportData.school.positionLabel || 'Class Position'}</div>
                    <div className="text-3xl font-black text-white">
                      {reportData.summary.positionSuffix} <span className="text-xs font-medium opacity-70 lowercase">out of {reportData.summary.totalStudents} students</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {reportData.summary.showAverages && (
              <div className="flex-1 border-2 border-slate-200 rounded-sm p-6 bg-white">
                <h3 className="uppercase text-[11px] font-black text-slate-500 mb-6 border-b-2 border-slate-200 pb-2">Internal Stats (Class Data)</h3>
                <div className="space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">{reportData.school.classAverageLabel || 'Class Average'}:</span>
                    <span className="font-black text-sm">{reportData.summary.classAverage}%</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">{reportData.school.highestScoreLabel || 'Highest Score'}:</span>
                    <span className="font-black text-sm text-emerald-600">{reportData.summary.highestAvg}%</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">{reportData.school.lowestScoreLabel || 'Lowest Score'}:</span>
                    <span className="font-black text-sm text-rose-600">{reportData.summary.lowestAvg}%</span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 mt-6 italic">Statistics generated based on peer comparison in the same academic level.</p>
              </div>
            )}
          </div>

          {/* Remarks Section */}
          <div className="space-y-8 mb-12 border-t-2 border-slate-800 pt-8 font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p className="text-[11px] font-black uppercase text-slate-400 mb-3 tracking-widest">{reportData.school.classTeacherLabel || 'Class Teacher'}'s Final Comment</p>
                <div className="p-6 border-2 border-slate-100 bg-slate-50 rounded-sm italic text-slate-800 text-sm font-medium min-h-[100px] leading-relaxed relative">
                  <span className="text-4xl absolute -top-2 left-2 text-indigo-100 font-serif opacity-50">"</span>
                  {reportData.remarks.teacher}
                  <span className="text-4xl absolute -bottom-6 right-2 text-indigo-100 font-serif opacity-50">"</span>
                </div>
                <div className="mt-4 pt-8 border-t border-slate-200 text-center">
                  <p className="text-xs font-black uppercase text-slate-900 border-b-2 border-slate-900 inline-block px-4">{reportData.student.classTeacherKey}</p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">{reportData.school.classTeacherLabel || 'Class Teacher'}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase text-slate-400 mb-3 tracking-widest">{reportData.school.headTeacherLabel || 'Head Teacher'}'s Final Directive</p>
                <div className="p-6 border-2 border-indigo-50 bg-indigo-50/30 rounded-sm italic text-slate-800 text-sm font-bold min-h-[100px] leading-relaxed relative">
                  <span className="text-4xl absolute -top-2 left-2 text-indigo-200 font-serif opacity-40">"</span>
                  {reportData.remarks.headteacher}
                  <span className="text-4xl absolute -bottom-6 right-2 text-indigo-200 font-serif opacity-40">"</span>
                </div>
                <div className="mt-4 pt-8 border-t border-slate-200 text-center">
                  <p className="text-xs font-black uppercase text-slate-900 border-b-2 border-slate-900 inline-block px-4">{reportData.school.headTeacherName}</p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">{reportData.school.headTeacherLabel || 'Head Teacher'} / Official Signature</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Branding */}
          {reportData.summary.showNextTermDate && reportData.summary.nextTermDate && (
             <div className="mt-6 p-4 border-2 border-slate-200 bg-slate-50 text-center rounded-sm font-sans font-bold text-indigo-900">
               <span className="text-[11px] uppercase text-slate-500 mr-2 tracking-widest">Next Term Begins:</span> {reportData.summary.nextTermDate}
             </div>
          )}
          
          <div className="mt-8 text-center border-t border-slate-100 pt-8 no-print">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.5em] leading-relaxed max-w-2xl mx-auto">{reportData.footerMessage || reportData.school.name}</p>
          </div>
        </div>
      ) : (
        <div className="no-print mt-12 p-24 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 animate-fade-in shadow-sm">
          <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6">
            <Layout className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Preview Environment Active</h3>
          <p className="max-w-xs text-slate-400 text-sm font-medium mb-8">Synchronize with your academic segments to generate a professional candidate report.</p>
          <div className="flex gap-4">
            <Badge variant="outline">Select Class</Badge>
            <ChevronRight className="w-4 h-4 text-slate-300 self-center" />
            <Badge variant="outline">Select Term</Badge>
            <ChevronRight className="w-4 h-4 text-slate-300 self-center" />
            <Badge variant="outline">Select Student</Badge>
          </div>
        </div>
      )}
    </div>
  );
}
