'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function ResultsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
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

  const loadResults = async () => {
    if (!selectedClass || !selectedTerm) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/results?classId=${selectedClass}&termId=${selectedTerm}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.students);
        setStats(data.classStats);
      }
    } catch (error) {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedTerm) {
      loadResults();
    }
  }, [selectedClass, selectedTerm]);

  const exportToExcel = () => {
    if (results.length === 0) return;
    
    const clsName = classes.find(c => c.id === selectedClass)?.name || 'Class';
    const termName = terms.find(t => t.id === selectedTerm)?.name || 'Term';
    
    // Create broadsheet data
    const exportData = results.map(r => {
      const row: any = {
        'Position': r.positionSuffix,
        'Student Name': r.studentName,
      };
      
      // Add each subject total
      r.subjects.forEach((s: any) => {
        row[s.subjectName] = s.finalTotal;
      });
      
      row['Total Marks'] = r.totalMarks;
      row['Average'] = r.average;
      row['Grade'] = r.grade;
      row['Remark'] = r.remark;
      
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Broadsheet');
    XLSX.writeFile(workbook, `Broadsheet_${clsName}_${termName}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" /> Results Summary
          </h1>
          <p className="text-gray-500 mt-1">View calculated averages, totals, and class rankings (Broadsheet)</p>
        </div>
        <button 
          onClick={exportToExcel}
          disabled={results.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> Export to Excel
        </button>
      </div>

      <div className="flex gap-4">
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 shadow-sm border-gray-200 dark:border-gray-800">
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 shadow-sm border-gray-200 dark:border-gray-800">
          {terms.map(t => <option key={t.id} value={t.id}>{t.name} ({t.academicYear?.name})</option>)}
        </select>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Class Average</p>
            <p className="text-2xl font-bold mt-1 text-blue-600">{stats.classAverage}%</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Highest Avg</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{stats.highestAvg}%</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Lowest Avg</p>
            <p className="text-2xl font-bold mt-1 text-red-500">{stats.lowestAvg}%</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Students Passed</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{stats.passCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Students Failed</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{stats.failCount}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Calculating results & rankings...</div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No results found for this class and term.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-200 sticky left-0 z-10">Pos</th>
                  <th className="sticky left-12 z-10 bg-gray-50 dark:bg-gray-800">Student Name</th>
                  {results[0]?.subjects.map((s: any) => (
                    <th key={s.subjectId} className="text-center text-[10px] uppercase tracking-tighter whitespace-nowrap px-1 py-8 h-32 align-bottom">
                      <div className="inline-block transform -rotate-90 origin-bottom-left translate-x-3">{s.subjectName}</div>
                    </th>
                  ))}
                  <th className="text-right border-l font-bold">Total</th>
                  <th className="text-right text-blue-600 font-bold">Average</th>
                  <th className="text-center">Grade</th>
                  <th className="text-center">Remark</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.studentId}>
                    <td className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/5 sticky left-0 z-10">{r.positionSuffix}</td>
                    <td className="font-medium sticky left-12 z-10 bg-white dark:bg-gray-900 whitespace-nowrap">{r.studentName}</td>
                    {r.subjects.map((s: any) => (
                      <td key={s.subjectId} className="text-center px-2 font-medium" title={`${s.subjectName} (${s.grade})`}>
                        {s.finalTotal}
                      </td>
                    ))}
                    <td className="text-right font-bold border-l">{r.totalMarks}</td>
                    <td className="text-right text-xl font-black gradient-text">{r.average}%</td>
                    <td className="text-center font-bold">{r.grade}</td>
                    <td className="text-center text-xs text-gray-500">{r.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
