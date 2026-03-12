'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, Search, Layout, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

export default function ReportCardsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  // 1. Initial configuration fetch
  useEffect(() => {
    Promise.all([
      fetch('/api/classes').then(res => res.json()),
      fetch('/api/terms').then(res => res.json())
    ]).then(([clsData, termData]) => {
      setClasses(clsData);
      const activeTerms = termData.filter((t: any) => t.isCurrent);
      setTerms(activeTerms.length > 0 ? activeTerms : termData);
      
      if (clsData.length > 0) setSelectedClass(clsData[0].id);
      if (activeTerms.length > 0) setSelectedTerm(activeTerms[0].id);
      else if (termData.length > 0) setSelectedTerm(termData[0].id);
    });
  }, []);

  // 2. Fetch students when class changes
  useEffect(() => {
    if (selectedClass) {
      fetch(`/api/students?classId=${selectedClass}`)
        .then(res => res.json())
        .then(data => {
          setStudents(data);
          if (data.length > 0) setSelectedStudent(data[0].id);
          else setSelectedStudent('');
        });
    }
  }, [selectedClass]);

  // 3. Fetch report data
  useEffect(() => {
    if (selectedStudent && selectedTerm) {
      fetchReport();
    } else {
      setReportData(null);
    }
  }, [selectedStudent, selectedTerm]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/report-card/${selectedStudent}?termId=${selectedTerm}`);
      if (res.ok) {
        setReportData(await res.json());
      } else {
        toast.error('Failed to generate report card');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast.success('Preparing professional PDF layout...');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen">
      {/* Selection Toolbar - Hidden when printing */}
      <div className="no-print space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" /> Administrative Report Center
            </h1>
            <p className="text-gray-500 mt-1">Generate and print professional student progress reports</p>
          </div>
          {reportData && (
            <div className="flex gap-3">
              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg shadow-sm transition-colors font-medium">
                <Printer className="w-4 h-4" /> Print Report
              </button>
              <button 
                onClick={handleDownloadPDF} 
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors font-medium disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Save as PDF
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Class</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500">
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Term</label>
            <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500">
              {terms.map(t => <option key={t.id} value={t.id}>{t.name} ({t.academicYear?.name})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Student</label>
            <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500">
              {students.map(s => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>)}
              {students.length === 0 && <option value="">No students found in this class</option>}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="no-print p-12 text-center text-gray-500 animate-pulse">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Generating secure report layout...
        </div>
      ) : reportData ? (
        <div id="report-card" className="bg-white text-black p-10 md:p-14 shadow-2xl rounded-sm max-w-[210mm] mx-auto min-h-[297mm] print:shadow-none print:m-0 print:p-0 print:max-w-full font-serif relative">
          
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
              <span className="font-black w-36 uppercase text-[10px] text-indigo-900 flex items-center">Student Name:</span> 
              <span className="font-bold text-lg uppercase flex-1">{reportData.student.lastName}, {reportData.student.firstName} {reportData.student.middleName}</span>
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
          </div>

          {/* Marks Table */}
          <div className="mb-10 font-sans">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="border-2 border-slate-800 px-4 py-4 text-left uppercase text-[11px] font-black w-1/3">Subject of Learning</th>
                  <th className="border-2 border-slate-800 px-2 py-4 text-center uppercase text-[11px] font-black">CA<br/><span className="text-[9px] font-normal opacity-70">({reportData.subjects[0]?.caWeight || 40}%)</span></th>
                  <th className="border-2 border-slate-800 px-2 py-4 text-center uppercase text-[11px] font-black">{reportData.school.examLabel || 'Exam'}<br/><span className="text-[9px] font-normal opacity-70">({reportData.school.examWeight || 60}%)</span></th>
                  <th className="border-2 border-slate-800 px-2 py-4 text-center uppercase text-[11px] font-black bg-slate-700">Total<br/><span className="text-[9px] font-normal opacity-70">(100%)</span></th>
                  <th className="border-2 border-slate-800 px-2 py-4 text-center uppercase text-[11px] font-black">Grade</th>
                  <th className="border-2 border-slate-800 px-4 py-4 text-left uppercase text-[11px] font-black">Remarks / Comment</th>
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
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Marks</div>
                  <div className="text-2xl font-black text-slate-800">{reportData.summary.totalMarks}</div>
                </div>
                <div className="text-center p-4 bg-white border border-slate-200 rounded shadow-sm">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average %</div>
                  <div className="text-2xl font-black text-indigo-700">{reportData.summary.average}</div>
                </div>
                {reportData.summary.showPositions && (
                  <div className="text-center p-4 bg-indigo-900 rounded col-span-2 shadow-lg">
                    <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.2em] mb-1">Official Rank in Class</div>
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
                    <span className="text-xs font-bold text-slate-500 uppercase">Class Average:</span>
                    <span className="font-black text-sm">{reportData.summary.classAverage}%</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Class Peak Score:</span>
                    <span className="font-black text-sm text-emerald-600">{reportData.summary.highestAvg}%</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Class Min Score:</span>
                    <span className="font-black text-sm text-red-600">{reportData.summary.lowestAvg}%</span>
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
                <p className="text-[11px] font-black uppercase text-slate-400 mb-3 tracking-widest">Class Teacher's Final Comment</p>
                <div className="p-6 border-2 border-slate-100 bg-slate-50 rounded-sm italic text-slate-800 text-sm font-medium min-h-[100px] leading-relaxed relative">
                  <span className="text-4xl absolute -top-2 left-2 text-indigo-100 font-serif opacity-50">"</span>
                  {reportData.remarks.teacher}
                  <span className="text-4xl absolute -bottom-6 right-2 text-indigo-100 font-serif opacity-50">"</span>
                </div>
                <div className="mt-4 pt-8 border-t border-slate-200 text-center">
                  <p className="text-xs font-black uppercase text-slate-900 border-b-2 border-slate-900 inline-block px-4">{reportData.student.classTeacherKey}</p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Class Teacher</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase text-slate-400 mb-3 tracking-widest">Head Teacher's Final Directive</p>
                <div className="p-6 border-2 border-indigo-50 bg-indigo-50/30 rounded-sm italic text-slate-800 text-sm font-bold min-h-[100px] leading-relaxed relative">
                  <span className="text-4xl absolute -top-2 left-2 text-indigo-200 font-serif opacity-40">"</span>
                  {reportData.remarks.headteacher}
                  <span className="text-4xl absolute -bottom-6 right-2 text-indigo-200 font-serif opacity-40">"</span>
                </div>
                <div className="mt-4 pt-8 border-t border-slate-200 text-center">
                  <p className="text-xs font-black uppercase text-slate-900 border-b-2 border-slate-900 inline-block px-4">{reportData.school.headTeacherName}</p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Head Teacher / Official Signature</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Branding */}
          <div className="mt-16 text-center border-t border-slate-100 pt-8 no-print">
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.5em]">{reportData.footerMessage || reportData.school.name}</p>
          </div>
        </div>
      ) : (
        <div className="no-print p-20 text-center text-slate-400 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border-2 border-dashed border-slate-100 dark:border-slate-800">
          <Layout className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-bold">Preview Environment</p>
          <p className="text-sm mt-1">Select a class and student above to generate a professional assessment report.</p>
        </div>
      )}
    </div>
  );
}
