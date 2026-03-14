'use client';

import { useState } from 'react';
import { BarChart3, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { GradeBadge } from '@/components/GradeBadge';

export default function ResultsPage() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');

  // Static Queries (once)
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await fetch('/api/classes');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.length > 0 && !selectedClass) setSelectedClass(data[0].id);
    }
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['terms'],
    queryFn: async () => {
      const res = await fetch('/api/terms');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.length > 0 && !selectedTerm) {
        const current = data.find((t: any) => t.isCurrent);
        setSelectedTerm(current ? current.id : data[0].id);
      }
    }
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      return res.json();
    }
  });

  // Main Results Query
  const { data: resultsData, isLoading: loading } = useQuery({
    queryKey: ['results', selectedClass, selectedTerm],
    queryFn: async () => {
      if (!selectedClass || !selectedTerm) return null;
      const res = await fetch(`/api/results?classId=${selectedClass}&termId=${selectedTerm}`);
      if (!res.ok) throw new Error('Failed to load results');
      return res.json();
    },
    enabled: !!selectedClass && !!selectedTerm
  });

  const results = resultsData?.students || [];
  const stats = resultsData?.classStats || null;

  const exportToExcel = () => {
    if (results.length === 0) return;
    
    const clsName = classes.find((c: any) => c.id === selectedClass)?.name || 'Class';
    const termName = terms.find((t: any) => t.id === selectedTerm)?.name || 'Term';
    
    const exportData = results.map((r: any) => {
      const row: any = {
        [settings?.positionLabel || 'Position']: r.positionSuffix,
        [settings?.studentLabel || 'Student Name']: r.studentName,
      };
      
      r.subjects.forEach((s: any) => {
        row[s.subjectName] = s.finalTotal;
      });
      
      row[settings?.totalMarksLabel || 'Total Marks'] = r.totalMarks;
      row[settings?.averageLabel || 'Average'] = r.average;
      row[settings?.gradeLabel || 'Grade'] = r.grade;
      row[settings?.remarksLabel || 'Remark'] = r.remark;
      
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Broadsheet');
    XLSX.writeFile(workbook, `Broadsheet_${clsName}_${termName}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in mb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" /> Results Summary
          </h1>
          <p className="text-gray-500 mt-1">View calculated averages, totals, and class rankings (Broadsheet)</p>
        </div>
        <Button 
          onClick={exportToExcel}
          variant="success"
          disabled={results.length === 0}
          className="shadow-md"
        >
          <Download className="w-4 h-4" /> Export BroadSheet
        </Button>
      </div>

      <div className="flex gap-4 premium-card p-4">
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="px-4 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none text-sm transition-all focus:ring-2 focus:ring-blue-500/10">
          {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="px-4 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none text-sm transition-all focus:ring-2 focus:ring-blue-500/10">
          {terms.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.academicYear?.name})</option>)}
        </select>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="premium-card p-5 text-center transition-all hover:scale-[1.02]">
            <p className="text-xs text-slate-500 uppercase font-black tracking-widest">{settings?.classAverageLabel || 'Class Average'}</p>
            <p className="text-3xl font-black mt-2 text-blue-600 dark:text-blue-400">{stats.classAverage}%</p>
          </div>
          <div className="premium-card p-5 text-center transition-all hover:scale-[1.02]">
            <p className="text-xs text-slate-500 uppercase font-black tracking-widest">{settings?.highestScoreLabel || 'Highest Avg'}</p>
            <p className="text-3xl font-black mt-2 text-emerald-600 dark:text-emerald-400">{stats.highestAvg}%</p>
          </div>
          <div className="premium-card p-5 text-center transition-all hover:scale-[1.02]">
            <p className="text-xs text-slate-500 uppercase font-black tracking-widest">{settings?.lowestScoreLabel || 'Lowest Avg'}</p>
            <p className="text-3xl font-black mt-2 text-rose-500">{stats.lowestAvg}%</p>
          </div>
          <div className="premium-card p-5 text-center transition-all hover:scale-[1.02]">
            <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Passed</p>
            <p className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{stats.passCount}</p>
          </div>
          <div className="premium-card p-5 text-center transition-all hover:scale-[1.02]">
            <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Failed</p>
            <p className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{stats.failCount}</p>
          </div>
        </div>
      )}

      <div className="premium-card">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
            <p className="animate-pulse font-medium">Calculating broadsheet ranking...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-20 text-center text-gray-500">
            <BarChart3 className="w-16 h-16 mx-auto text-slate-200 mb-4" />
            <p className="text-lg font-bold text-slate-900 dark:text-white">No results found</p>
            <p className="text-sm">Please ensure marks are entered for this class and term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="bg-amber-50/80 dark:bg-amber-900/10 text-amber-800 dark:text-amber-200 sticky left-0 z-10">{settings?.positionLabel || 'Pos'}</th>
                  <th className="sticky left-12 z-10 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-md">{settings?.studentLabel || 'Student Name'}</th>
                  {results[0]?.subjects.map((s: any) => (
                    <th key={s.subjectId} className="text-center text-[10px] uppercase tracking-tighter whitespace-nowrap px-1 py-8 h-32 align-bottom">
                      <div className="inline-block transform -rotate-90 origin-bottom-left translate-x-3">{s.subjectName}</div>
                    </th>
                  ))}
                  <th className="text-right border-l border-slate-200 dark:border-slate-800 font-bold">{settings?.totalMarksLabel || 'Total'}</th>
                  <th className="text-right text-blue-600 font-bold">{settings?.averageLabel || 'Average'}</th>
                  <th className="text-center">{settings?.gradeLabel || 'Grade'}</th>
                  <th className="text-center">{settings?.remarksLabel || 'Remark'}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r: any) => (
                  <tr key={r.studentId}>
                    <td className="font-black text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/20 sticky left-0 z-10">{r.positionSuffix}</td>
                    <td className="font-bold sticky left-12 z-10 bg-white dark:bg-slate-900 whitespace-nowrap">{r.studentName}</td>
                    {r.subjects.map((s: any) => (
                      <td key={s.subjectId} className="text-center px-2 font-semibold text-slate-700 dark:text-slate-300">
                        {s.finalTotal}
                      </td>
                    ))}
                    <td className="text-right font-bold border-l border-slate-100 dark:border-slate-900">{r.totalMarks}</td>
                    <td className="text-right text-lg font-black gradient-text">{r.average}%</td>
                    <td className="text-center">
                      <GradeBadge grade={r.grade} />
                    </td>
                    <td className="text-center text-xs text-slate-500 font-medium">{r.remark}</td>
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
