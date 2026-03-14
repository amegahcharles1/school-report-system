'use client';

import React, { useState } from 'react';
import { ClipboardEdit, Save, History, ChevronDown, ChevronUp, ChevronsUpDown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GradeBadge } from '@/components/GradeBadge';
import type { MarksEntry } from '@/types';

type SortDir = 'asc' | 'desc' | null;

type MarkAudit = {
  id: string;
  createdAt: string;
  modifiedBy?: { name?: string } | null;
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
};

type SortIconProps = {
  col: string;
  sortColumn: string | null;
  sortDir: SortDir;
};

function SortIcon({ col, sortColumn, sortDir }: SortIconProps) {
  if (sortColumn !== col) return <ChevronsUpDown className="w-3 h-3 text-slate-300 inline ml-1" />;
  if (sortDir === 'asc') return <ChevronUp className="w-3 h-3 text-blue-500 inline ml-1" />;
  return <ChevronDown className="w-3 h-3 text-blue-500 inline ml-1" />;
}

export default function MarksEntryPage() {
  type SessionUser = { id?: string; role?: string };
  const { data: session } = useSession();
  const userId = (session?.user as SessionUser)?.id;
  const queryClient = useQueryClient();

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<string[]>([]);
  const [localMarks, setLocalMarks] = useState<MarksEntry[]>([]);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // Queries
  type ClassItem = { id: string; name: string; classTeacherId?: string | null };

  const { data: classes = [] } = useQuery<ClassItem[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await fetch('/api/classes');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.length > 0 && !selectedClass) setSelectedClass(data[0].id);
    }
  });

  type TermItem = { id: string; name: string; isCurrent?: boolean; academicYear?: { name: string } };

  const { data: terms = [] } = useQuery<TermItem[]>({
    queryKey: ['terms'],
    queryFn: async () => {
      const res = await fetch('/api/terms');
      return res.json();
    },
    onSuccess: (data) => {
      const active = data.filter((t) => t.isCurrent);
      if (active.length > 0 && !selectedTerm) setSelectedTerm(active[0].id);
      else if (data.length > 0 && !selectedTerm) setSelectedTerm(data[0].id);
    }
  });

  type SubjectItem = { id: string; name: string; subjectAssignments?: { classId: string }[]; teacherAssignments?: { classId: string }[] };

  const { data: subjects = [] } = useQuery<SubjectItem[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await fetch('/api/subjects');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.length > 0 && !selectedSubject) setSelectedSubject(data[0].id);
    }
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      return res.json();
    }
  });

  const { data: gradeConfigs = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const res = await fetch('/api/grades');
      return res.json();
    }
  });

  const { isLoading: loading } = useQuery<MarksEntry[]>({
    queryKey: ['marks', selectedClass, selectedTerm, selectedSubject],
    queryFn: async () => {
      if (!selectedClass || !selectedTerm || !selectedSubject) return [];
      const res = await fetch(`/api/marks?classId=${selectedClass}&termId=${selectedTerm}&subjectId=${selectedSubject}`);
      if (!res.ok) throw new Error('Failed to fetch marks');
      const data = await res.json();
      setLocalMarks(data);
      return data;
    },
    enabled: !!selectedClass && !!selectedTerm && !!selectedSubject
  });

  // Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selectedSubject, termId: selectedTerm, marks: localMarks }),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Marks updated and synced!');
      queryClient.invalidateQueries({ queryKey: ['marks'] });
    },
    onError: () => toast.error('Check your network connection and try again.')
  });

  const handleMarkChange = (studentId: string, field: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setLocalMarks(prev => prev.map(m => m.studentId === studentId ? { ...m, [field]: numValue } : m));
  };

  const toggleExpand = (studentId: string) => {
    setExpandedStudents(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
  };

  const calculateSubtotal = (m: MarksEntry) => (m.test1 || 0) + (m.assignment1 || 0) + (m.test2 || 0) + (m.assignment2 || 0);
  const calculateTotal = (m: MarksEntry) => {
    const caWeight = settings?.caWeight ?? 40;
    const examWeight = settings?.examWeight ?? 60;
    const ca = calculateSubtotal(m) * (caWeight / 100);
    const exam = (m.examScore || 0) * (examWeight / 100);
    return Math.round((ca + exam) * 100) / 100;
  };

  const getPreviewGrade = (total: number) => {
    if (!gradeConfigs.length) return null;
    const sorted = [...gradeConfigs].sort((a, b) => b.minScore - a.minScore);
    for (const g of sorted) {
      if (total >= g.minScore && total <= g.maxScore) return g.grade;
    }
    return null;
  };

  const handleSort = (col: string) => {
    if (sortColumn !== col) { setSortColumn(col); setSortDir('asc'); return; }
    if (sortDir === 'asc') { setSortDir('desc'); return; }
    setSortColumn(null); setSortDir(null);
  };

  const sortedMarks = (() => {
    if (!sortColumn || !sortDir) return localMarks;
    return [...localMarks].sort((a, b) => {
      let valA: string | number | null = null;
      let valB: string | number | null = null;
      const subtotalA = calculateSubtotal(a);
      const subtotalB = calculateSubtotal(b);
      switch (sortColumn) {
        case 'name':
          valA = a.studentName?.toLowerCase() ?? '';
          valB = b.studentName?.toLowerCase() ?? '';
          break;
        case 'test1':
          valA = a.test1 || 0;
          valB = b.test1 || 0;
          break;
        case 'assign1':
          valA = a.assignment1 || 0;
          valB = b.assignment1 || 0;
          break;
        case 'test2':
          valA = a.test2 || 0;
          valB = b.test2 || 0;
          break;
        case 'assign2':
          valA = a.assignment2 || 0;
          valB = b.assignment2 || 0;
          break;
        case 'caSubtotal':
          valA = subtotalA;
          valB = subtotalB;
          break;
        case 'ca40':
          valA = subtotalA * (settings?.caWeight ?? 40);
          valB = subtotalB * (settings?.caWeight ?? 40);
          break;
        case 'exam':
          valA = a.examScore || 0;
          valB = b.examScore || 0;
          break;
        case 'exam60':
          valA = (a.examScore || 0) * (settings?.examWeight ?? 60);
          valB = (b.examScore || 0) * (settings?.examWeight ?? 60);
          break;
        case 'total':
          valA = calculateTotal(a);
          valB = calculateTotal(b);
          break;
        default:
          return 0;
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  })();

  const thClass = (col: string) =>
    `cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${sortColumn === col ? 'text-blue-600 dark:text-blue-400' : ''}`;

  return (
    <div className="space-y-6 animate-fade-in mb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardEdit className="w-6 h-6 text-blue-600" /> {settings?.marksEntryLabel || 'Marks Entry'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Record continuous assessment and exam scores · {settings?.sortInstructionLabel || 'Click column to sort'}</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || localMarks.length === 0} variant="premium">
          <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      {/* Selection Toolbar */}
      <div className="premium-card p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none text-sm transition-all focus:ring-2 focus:ring-blue-500/10">
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Academic Term</label>
          <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none text-sm transition-all focus:ring-2 focus:ring-blue-500/10">
            {terms.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.academicYear?.name})</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject of Learning</label>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none text-sm transition-all focus:ring-2 focus:ring-blue-500/10">
            {subjects
              .filter((s) => s.subjectAssignments?.some((sa) => sa.classId === selectedClass))
              .filter((s) => {
                const isClassTeacher = classes.find((c) => c.id === selectedClass)?.classTeacherId === userId;
                if (isClassTeacher) return true;
                if (s.teacherAssignments) return s.teacherAssignments.some((ta) => ta.classId === selectedClass);
                return true;
              })
              .map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="premium-card flex flex-col">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
            <p className="animate-pulse">Fetching class marks spreadsheet...</p>
          </div>
        ) : localMarks.length === 0 ? (
          <div className="p-20 text-center text-slate-500">
            <ClipboardEdit className="w-16 h-16 mx-auto text-slate-100 mb-4" />
            <p className="text-lg font-bold text-slate-900 dark:text-white">Empty Roster</p>
            <p className="text-sm">No students were found in the selected class.</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <div className="flex gap-3 text-sm font-medium flex-wrap">
                <Badge variant="success">
                  {localMarks.filter(m => m.examScore > 0).length} Scored
                </Badge>
                <Badge variant="warning">
                  {localMarks.filter(m => !m.examScore).length} Pending
                </Badge>
                {sortColumn && (
                  <Button variant="ghost" size="sm" onClick={() => { setSortColumn(null); setSortDir(null); }} className="h-6 text-[10px]">
                    ✕ Reset Sort
                  </Button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')} className={`sticky left-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl z-10 w-48 ${thClass('name')}`}>
                      {settings?.studentLabel || 'Student Name'} <SortIcon col="name" sortColumn={sortColumn} sortDir={sortDir} />
                    </th>
                    <th onClick={() => handleSort('test1')} className={`text-center ${thClass('test1')}`} style={{ minWidth: settings?.columnWidth || 100 }}>
                      {settings?.test1Label || 'Test 1'} <SortIcon col="test1" sortColumn={sortColumn} sortDir={sortDir} /><br /><span className="text-[10px] font-black text-slate-400">(25)</span>
                    </th>
                    <th onClick={() => handleSort('assign1')} className={`text-center ${thClass('assign1')}`} style={{ minWidth: settings?.columnWidth || 100 }}>
                      {settings?.assignment1Label || 'Assign 1'} <SortIcon col="assign1" sortColumn={sortColumn} sortDir={sortDir} /><br /><span className="text-[10px] font-black text-slate-400">(25)</span>
                    </th>
                    <th onClick={() => handleSort('test2')} className={`text-center ${thClass('test2')}`} style={{ minWidth: settings?.columnWidth || 100 }}>
                      {settings?.test2Label || 'Test 2'} <SortIcon col="test2" sortColumn={sortColumn} sortDir={sortDir} /><br /><span className="text-[10px] font-black text-slate-400">(25)</span>
                    </th>
                    <th onClick={() => handleSort('assign2')} className={`text-center ${thClass('assign2')}`} style={{ minWidth: settings?.columnWidth || 100 }}>
                      {settings?.assignment2Label || 'Assign 2'} <SortIcon col="assign2" sortColumn={sortColumn} sortDir={sortDir} /><br /><span className="text-[10px] font-black text-slate-400">(25)</span>
                    </th>
                    <th onClick={() => handleSort('caSubtotal')} className={`text-center bg-blue-50/30 dark:bg-blue-900/5 ${thClass('caSubtotal')}`} style={{ minWidth: 100 }}>
                      {settings?.caSubtotalLabel || 'Subtotal'} <SortIcon col="caSubtotal" sortColumn={sortColumn} sortDir={sortDir} /><br /><span className="text-[10px] font-black text-slate-400">(100)</span>
                    </th>
                    <th onClick={() => handleSort('ca40')} className={`text-center text-blue-600 ${thClass('ca40')}`} style={{ minWidth: 80 }}>
                      {settings?.caWeightLabel || 'CA'} {settings?.caWeight ?? 40}% <SortIcon col="ca40" sortColumn={sortColumn} sortDir={sortDir} />
                    </th>
                    <th onClick={() => handleSort('exam')} className={`text-center border-l border-slate-200 dark:border-slate-800 ${thClass('exam')}`} style={{ minWidth: settings?.columnWidth || 100 }}>
                      {settings?.examLabel || 'Exam'} <SortIcon col="exam" sortColumn={sortColumn} sortDir={sortDir} /><br /><span className="text-[10px] font-black text-slate-400">(100)</span>
                    </th>
                    <th onClick={() => handleSort('exam60')} className={`text-center text-blue-600 ${thClass('exam60')}`} style={{ minWidth: 80 }}>
                      {settings?.examWeightLabel || 'Exam'} {settings?.examWeight ?? 60}% <SortIcon col="exam60" sortColumn={sortColumn} sortDir={sortDir} />
                    </th>
                    <th onClick={() => handleSort('total')} className={`text-center font-bold border-l border-slate-200 dark:border-slate-800 ${thClass('total')}`}>
                      {settings?.finalTotalLabel || 'Final'} <SortIcon col="total" sortColumn={sortColumn} sortDir={sortDir} />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {sortedMarks.map((m) => {
                    const subtotal = calculateSubtotal(m);
                    const caWeight = settings?.caWeight || 40;
                    const examWeight = settings?.examWeight || 60;
                    const caContribution = Math.round(subtotal * (caWeight / 100) * 100) / 100;
                    const examContribution = Math.round((m.examScore || 0) * (examWeight / 100) * 100) / 100;
                    const total = Math.round((caContribution + examContribution) * 100) / 100;
                    const previewGrade = getPreviewGrade(total);

                    return (
                      <React.Fragment key={m.studentId}>
                        <tr className="group">
                          <td className="font-bold sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center justify-between">
                              <span className="truncate max-w-[140px] text-slate-900 dark:text-white">{m.studentName}</span>
                              {m.audits && m.audits.length > 0 && (
                                <Button
                                  variant="ghost" size="icon"
                                  onClick={() => toggleExpand(m.studentId)}
                                  className="h-7 w-7 text-slate-400 hover:text-blue-600"
                                >
                                  {expandedStudents.includes(m.studentId) ? <ChevronUp className="w-3.5 h-3.5" /> : <History className="w-3.5 h-3.5" />}
                                </Button>
                              )}
                            </div>
                          </td>
                          <td className="p-0.5" style={{ minWidth: settings?.columnWidth || 100 }}>
                            <input type="number" min="0" max="25" step="0.1" value={m.test1 || ''} onChange={e => handleMarkChange(m.studentId, 'test1', e.target.value)} className="w-full text-center py-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all font-medium border-b-2 border-transparent focus:border-blue-500" />
                          </td>
                          <td className="p-0.5" style={{ minWidth: settings?.columnWidth || 100 }}>
                            <input type="number" min="0" max="25" step="0.1" value={m.assignment1 || ''} onChange={e => handleMarkChange(m.studentId, 'assignment1', e.target.value)} className="w-full text-center py-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all font-medium border-b-2 border-transparent focus:border-blue-500" />
                          </td>
                          <td className="p-0.5" style={{ minWidth: settings?.columnWidth || 100 }}>
                            <input type="number" min="0" max="25" step="0.1" value={m.test2 || ''} onChange={e => handleMarkChange(m.studentId, 'test2', e.target.value)} className="w-full text-center py-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all font-medium border-b-2 border-transparent focus:border-blue-500" />
                          </td>
                          <td className="p-0.5" style={{ minWidth: settings?.columnWidth || 100 }}>
                            <input type="number" min="0" max="25" step="0.1" value={m.assignment2 || ''} onChange={e => handleMarkChange(m.studentId, 'assignment2', e.target.value)} className="w-full text-center py-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all font-medium border-b-2 border-transparent focus:border-blue-500" />
                          </td>
                          <td className="text-center font-bold text-slate-400 bg-slate-50/30 dark:bg-slate-900/10" style={{ minWidth: 100 }}>{subtotal}</td>
                          <td className="text-center font-black text-blue-600 dark:text-blue-400" style={{ minWidth: 80 }}>{caContribution}</td>
                          <td className="p-0.5 border-l border-slate-100 dark:border-slate-800" style={{ minWidth: settings?.columnWidth || 100 }}>
                            <input type="number" min="0" max="100" step="0.1" value={m.examScore || ''} onChange={e => handleMarkChange(m.studentId, 'examScore', e.target.value)} className="w-full text-center py-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all font-black border-b-2 border-transparent focus:border-blue-600 text-blue-700 dark:text-blue-300" />
                          </td>
                          <td className="text-center font-black text-blue-600 dark:text-blue-400" style={{ minWidth: 80 }}>{examContribution}</td>
                          <td className="text-center border-l border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col items-center gap-1 min-w-[70px]">
                              <span className="text-lg font-black gradient-text">{total}</span>
                              <GradeBadge grade={previewGrade || ''} className="scale-75 origin-top" />
                            </div>
                          </td>
                        </tr>
                        {expandedStudents.includes(m.studentId) && (
                          <tr className="bg-slate-50/50 dark:bg-slate-900/50 shadow-inner">
                            <td colSpan={10} className="p-6">
                              <div className="flex flex-col gap-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                  <History className="w-3 h-3" /> Correction History
                                </h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-3">
                                  {m.audits?.map((audit: MarkAudit) => (
                                    <div key={audit.id} className="flex flex-wrap items-center gap-4 text-xs premium-card px-4 py-3 bg-white/60 dark:bg-slate-800/40">
                                      <span className="text-slate-400 font-medium">{new Date(audit.createdAt).toLocaleString()}</span>
                                      <Badge variant="outline" className="bg-white/50">{audit.modifiedBy?.name || 'Unknown'}</Badge>
                                      <span className="font-bold text-slate-600 dark:text-slate-300">Updated {audit.field}</span>
                                      <div className="flex items-center gap-2 ms-auto">
                                        <span className="text-rose-500 line-through font-bold">{audit.oldValue}</span>
                                        <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90" />
                                        <span className="text-emerald-600 font-extrabold">{audit.newValue}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
