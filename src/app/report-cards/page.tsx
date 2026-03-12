'use client';

import { useState, useEffect } from 'react';
import { FileText, Printer, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportCardsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/classes').then(res => res.json()),
      fetch('/api/terms').then(res => res.json())
    ]).then(([clsData, termData]) => {
      setClasses(clsData);
      setTerms(termData);
      if (clsData.length > 0) setSelectedClass(clsData[0].id);
      if (termData.length > 0) {
        const current = termData.find((t: any) => t.isCurrent);
        setSelectedTerm(current ? current.id : termData[0].id);
      }
    });
  }, []);

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

  useEffect(() => {
    if (selectedStudent && selectedTerm) {
      setLoading(true);
      fetch(`/api/report-card/${selectedStudent}?termId=${selectedTerm}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setReportData(data);
        })
        .catch(err => {
          toast.error(err.message || 'Failed to generate report card');
          setReportData(null);
        })
        .finally(() => setLoading(false));
    } else {
      setReportData(null);
    }
  }, [selectedStudent, selectedTerm]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-card');
    if (!element) return;
    
    // Dynamically import to prevent SSR issues with browser APIs
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    try {
      setLoading(true);
      const canvas = await html2canvas(element, {
        scale: 2, // higher resolution
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${reportData?.student?.lastName}_${reportData?.student?.firstName}_Report_Card.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen">
      {/* Selection Toolbar - Hidden when printing */}
      <div className="no-print space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" /> Report Cards
            </h1>
            <p className="text-gray-500 mt-1">Generate and print student report cards</p>
          </div>
          {reportData && (
            <div className="flex gap-3">
              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg shadow-sm transition-colors font-medium">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button 
                onClick={handleDownloadPDF} 
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors font-medium disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> {loading ? 'Processing...' : 'Download PDF'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex gap-4">
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 outline-none">
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 outline-none">
            {terms.map(t => <option key={t.id} value={t.id}>{t.name} ({t.academicYear?.name})</option>)}
          </select>
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 outline-none">
            {students.map(s => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>)}
            {students.length === 0 && <option value="">No students found</option>}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="no-print p-12 text-center text-gray-500">Generating beautiful report card...</div>
      ) : reportData ? (
        <div id="report-card" className="bg-white text-black p-8 md:p-12 shadow-2xl rounded-sm max-w-[210mm] mx-auto min-h-[297mm] print:shadow-none print:m-0 print:p-0 print:max-w-full">
          {/* Header */}
          <div className="text-center border-b-4 border-indigo-900 pb-6 mb-8">
            <h1 className="text-4xl font-black uppercase text-indigo-900 tracking-wider font-serif">
              {reportData.school.name}
            </h1>
            <p className="text-lg italic text-gray-700 mt-2 font-serif">{reportData.school.motto}</p>
            <p className="text-sm text-gray-600 mt-1">{reportData.school.address} | {reportData.school.phone}</p>
            <div className="mt-6 inline-block bg-indigo-900 text-white px-6 py-2 uppercase tracking-widest font-bold rounded-sm">
              Terminal Report Card
            </div>
          </div>

          {/* Student Info Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 bg-indigo-50/50 p-6 border border-indigo-100 rounded">
            <div className="flex"><span className="font-bold w-32 uppercase text-xs text-indigo-900">Name:</span> <span className="font-medium text-lg border-b border-gray-400 border-dotted flex-1 uppercase">{reportData.student.lastName}, {reportData.student.firstName} {reportData.student.middleName}</span></div>
            <div className="flex"><span className="font-bold w-32 uppercase text-xs text-indigo-900">Term:</span> <span className="font-medium border-b border-gray-400 border-dotted flex-1">{reportData.term}</span></div>
            <div className="flex"><span className="font-bold w-32 uppercase text-xs text-indigo-900">Class:</span> <span className="font-medium border-b border-gray-400 border-dotted flex-1 font-bold">{reportData.student.className}</span></div>
            <div className="flex"><span className="font-bold w-32 uppercase text-xs text-indigo-900">Academic Year:</span> <span className="font-medium border-b border-gray-400 border-dotted flex-1">{reportData.academicYear}</span></div>
            <div className="flex"><span className="font-bold w-32 uppercase text-xs text-indigo-900">Gender:</span> <span className="font-medium border-b border-gray-400 border-dotted flex-1">{reportData.student.gender}</span></div>

          </div>

          {/* Marks Table */}
          <table className="w-full mb-8 border-collapse border border-gray-300">
            <thead>
              <tr className="bg-indigo-900 text-white">
                <th className="border border-indigo-900 px-3 py-3 text-left uppercase text-xs font-bold w-1/3">Subject</th>
                <th className="border border-indigo-900 px-2 py-3 text-center uppercase text-xs font-bold">Class<br/>(40%)</th>
                <th className="border border-indigo-900 px-2 py-3 text-center uppercase text-xs font-bold">Exam<br/>(60%)</th>
                <th className="border border-indigo-900 px-2 py-3 text-center uppercase text-xs font-bold bg-indigo-800">Total<br/>(100%)</th>
                <th className="border border-indigo-900 px-2 py-3 text-center uppercase text-xs font-bold">Grade</th>
                <th className="border border-indigo-900 px-3 py-3 text-left uppercase text-xs font-bold">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {reportData.subjects.map((s: any, i: number) => (
                <tr key={s.subjectId} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-3 py-2 font-semibold text-sm">{s.subjectName}</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-sm">{s.caContribution}</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-sm">{s.examContribution}</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-sm bg-indigo-50/50">{s.finalTotal}</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-indigo-700">{s.grade}</td>
                  <td className="border border-gray-300 px-3 py-2 text-sm italic text-gray-600">{s.remark}</td>
                </tr>
              ))}
              {reportData.subjects.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500 border border-gray-300">No marks recorded for this term.</td></tr>
              )}
            </tbody>
          </table>

          {/* Performance Summary */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1 border-2 border-indigo-100 rounded p-4">
              <h3 className="uppercase text-xs font-bold text-indigo-900 mb-4 border-b pb-2">Academic Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-xs text-gray-500 uppercase">Total Marks</div>
                  <div className="text-xl font-bold">{reportData.summary.totalMarks}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-xs text-gray-500 uppercase">Average %</div>
                  <div className="text-2xl font-black text-indigo-700">{reportData.summary.average}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded col-span-2">
                  <div className="text-xs text-gray-500 uppercase">Class Position</div>
                  <div className="text-2xl font-bold text-amber-600">
                    {reportData.summary.positionSuffix} <span className="text-sm font-normal text-gray-500">out of {reportData.summary.totalStudents}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 border-2 border-indigo-100 rounded p-4">
              <h3 className="uppercase text-xs font-bold text-indigo-900 mb-4 border-b pb-2">Class Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                  <span className="text-sm font-medium">Class Average:</span>
                  <span className="font-bold">{reportData.summary.classAverage}%</span>
                </div>
                <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                  <span className="text-sm font-medium">Highest Average:</span>
                  <span className="font-bold text-green-600">{reportData.summary.highestAvg}%</span>
                </div>
                <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                  <span className="text-sm font-medium">Lowest Average:</span>
                  <span className="font-bold text-red-600">{reportData.summary.lowestAvg}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Remarks Bottom */}
          <div className="space-y-6 mb-8 border-t-2 border-indigo-900 pt-6">
            <div>
              <p className="text-sm font-bold uppercase text-indigo-900 mb-1">Class Teacher's Remark:</p>
              <div className="p-3 border border-gray-300 bg-gray-50 rounded italic text-gray-800 min-h-[60px] flex items-center">
                "{reportData.remarks.teacher}"
              </div>
            </div>
            <div>
              <p className="text-sm font-bold uppercase text-indigo-900 mb-1">Headteacher's Remark:</p>
              <div className="p-3 border border-gray-300 bg-gray-50 rounded italic text-gray-800 font-medium min-h-[60px] flex items-center">
                "{reportData.remarks.headteacher}"
              </div>
            </div>
          </div>

          <div className="flex justify-end items-end mt-12 pt-8 border-t border-gray-300">
            <div className="text-center w-48">
              <div className="border-b border-black mb-2 h-8"></div>
              <p className="text-xs uppercase font-bold text-gray-500">Signature / Stamp</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-print p-12 text-center text-gray-500 bg-white rounded-xl shadow-sm">
          Select a class and student to view their report card
        </div>
      )}
    </div>
  );
}
