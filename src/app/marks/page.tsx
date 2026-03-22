'use client';

import React, { useState, useCallback } from 'react';
import { ClipboardEdit, Save, History, ChevronDown, ChevronUp, ChevronsUpDown, AlertCircle } from 'lucide-react';
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

type SortIconProps = { col: string; sortColumn: string | null; sortDir: SortDir };

function SortIcon({ col, sortColumn, sortDir }: SortIconProps) {
  if (sortColumn !== col) return <ChevronsUpDown className="w-3 h-3 text-slate-300 inline ml-1" />;
  if (sortDir === 'asc') return <ChevronUp className="w-3 h-3 text-blue-500 inline ml-1" />;
  return <ChevronDown className="w-3 h-3 text-blue-500 inline ml-1" />;
}

// Per-field max score limits
const FIELD_MAX: Record<string, number> = {
  test1: 25,
  assignment1: 25,
  test2: 25,
  assignment2: 25,
  examScore: 100,
};

// Validated mark input component
type MarkInputProps = {
  value: number;
  field: string;
  studentId: string;
  onChange: (studentId: string, field: string, value: string) => void;
  onError: (studentId: string, field: string, err: string | null) => void;
  hasError: boolean;
  minWidth?: number;
  className?: string;
};

function MarkInput({ value, field, studentId, onChange, onError, hasError, minWidth = 100, className = '' }: MarkInputProps) {
  const max = FIELD_MAX[field] ?? 100;
  const [raw, setRaw] = useState<string>(value > 0 ? String(value) : '');

  // Keep raw in sync when parent data changes (e.g., fresh fetch)
  React.useEffect(() => {
    setRaw(value > 0 ? String(value) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Block strings that are clearly invalid numbers (but allow typing in progress)
    if (val !== '' && !/^\d*\.?\d*$/.test(val)) return;

    setRaw(val);

    if (val === '') {
      onChange(studentId, field, '');
      onError(studentId, field, null);
      return;
    }

    const num = parseFloat(val);
    if (isNaN(num)) return;

    if (num < 0) {
      onError(studentId, field, `Min is 0`);
    } else if (num > max) {
      onError(studentId, field, `Max is ${max}`);
    } else {
      onError(studentId, field, null);
    }
    onChange(studentId, field, val);
  };

  const handleBlur = () => {
    if (raw === '') {
      onChange(studentId, field, '');
      onError(studentId, field, null);
      return;
    }
    let num = parseFloat(raw);
    if (isNaN(num) || num < 0) num = 0;
    if (num > max) num = max;
    const clamped = String(Math.round(num * 10) / 10);
    setRaw(clamped);
    onChange(studentId, field, clamped);
    onError(studentId, field, null);
  };

  // Block e, E, +, - from number inputs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
  };

  const borderColor = hasError
    ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 focus:border-rose-500'
    : 'border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950';

  return (
    <td className="p-0.5 relative" style={{ minWidth }}>
      <input
        type="text"
        inputMode="decimal"
        value={raw}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full text-center py-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 outline-none transition-all font-medium border-b-2 ${borderColor} ${className}`}
      />
      {hasError && (
        <div className="absolute -top-0.5 right-0.5 z-20">
          <AlertCircle className="w-3 h-3 text-rose-500" />
        </div>
      )}
    </td>
  );
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
  // Map of studentId → fieldName → error message
  const [fieldErrors, setFieldErrors] = useState<Record<string, Record<string, string>>>({});

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // Queries
  type ClassItem = { id: string; name: string; classTeacherId?: string | null };

  const { data: classes = [] } = useQuery<ClassItem[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await fetch('/api/classes');
      if (!res.ok) throw new Error('Failed to fetch classes');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  type TermItem = { id: string; name: string; isCurrent?: boolean; academicYear?: { name: string } };

  const { data: terms = [] } = useQuery<TermItem[]>({
    queryKey: ['terms'],
    queryFn: async () => {
      const res = await fetch('/api/terms');
      if (!res.ok) throw new Error('Failed to fetch terms');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  type SubjectItem = { id: string; name: string; subjectAssignments?: { classId: string }[]; teacherAssignments?: { classId: string }[] };

  const { data: subjects = [] } = useQuery<SubjectItem[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await fetch('/api/subjects');
      if (!res.ok) throw new Error('Failed to fetch subjects');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  React.useEffect(() => {
    if (Array.isArray(classes) && classes.length > 0 && !selectedClass) setSelectedClass(classes[0].id);
  }, [classes, selectedClass]);

  React.useEffect(() => {
    if (Array.isArray(terms) && terms.length > 0 && !selectedTerm) {
      const active = terms.filter((t) => t.isCurrent);
      if (active.length > 0) setSelectedTerm(active[0].id);
      else setSelectedTerm(terms[0].id);
    }
  }, [terms, selectedTerm]);

  React.useEffect(() => {
    if (Array.isArray(subjects) && subjects.length > 0 && !selectedSubject) setSelectedSubject(subjects[0].id);
  }, [subjects, selectedSubject]);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) return {};
      return res.json();
    }
  });

  const { data: gradeConfigs = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const res = await fetch('/api/grades');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
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
      setFieldErrors({}); // clear errors on fresh fetch
      return data;
    },
    enabled: !!selectedClass && !!selectedTerm && !!selectedSubject
  });

  // Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Block save if any validation errors exist
      const hasErrors = Object.values(fieldErrors).some(fields =>
        Object.values(fields).some(err => !!err)
      );
      if (hasErrors) throw new Error('Fix validation errors before saving');

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
    onError: (err: Error) => toast.error(err.message || 'Check your network and try again.')
  });

  const handleMarkChange = useCallback((studentId: string, field: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setLocalMarks(prev => prev.map(m => m.studentId === studentId ? { ...m, [field]: isNaN(numValue) ? 0 : numValue } : m));
  }, []);

  const handleFieldError = useCallback((studentId: string, field: string, err: string | null) => {
    setFieldErrors(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [field]: err || '' }
    }));
  }, []);

  const hasFieldError = (studentId: string, field: string) =>
    !!(fieldErrors[studentId]?.[field]);

  const totalErrors = Object.values(fieldErrors).reduce((acc, fields) =>
    acc + Object.values(fields).filter(e => !!e).length, 0);

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
        case 'name': valA = a.studentName?.toLowerCase() ?? ''; valB = b.studentName?.toLowerCase() ?? ''; break;
        case 'test1': valA = a.test1 || 0; valB = b.test1 || 0; break;
        case 'assign1': valA = a.assignment1 || 0; valB = b.assignment1 || 0; break;
        case 'test2': valA = a.test2 || 0; valB = b.test2 || 0; break;
        case 'assign2': valA = a.assignment2 || 0; valB = b.assignment2 || 0; break;
        case 'caSubtotal': valA = subtotalA; valB = subtotalB; break;
        case 'ca40': valA = subtotalA * (settings?.caWeight ?? 40); valB = subtotalB * (settings?.caWeight ?? 40); break;
        case 'exam': valA = a.examScore || 0; valB = b.examScore || 0; break;
        case 'exam60': valA = (a.examScore || 0) * (settings?.examWeight ?? 60); valB = (b.examScore || 0) * (settings?.examWeight ?? 60); break;
        case 'total': valA = calculateTotal(a); valB = calculateTotal(b); break;
        default: return 0;
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  })();

  const thClass = (col: string) =>
    `cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap ${sortColumn === col ? 'text-blue-600 dark:text-blue-400' : ''}`;

  const colW = settings?.columnWidth || 100;

  return (
    <div className="space-y-6 animate-fade-in mb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardEdit className="w-6 h-6 text-blue-600" /> {settings?.marksEntryLabel || 'Marks Entry'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Record continuous assessment and exam scores · {settings?.sortInstructionLabel || 'Click column headers to sort'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {totalErrors > 0 && (
            <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl px-3 py-1.5 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              {totalErrors} validation {totalErrors === 1 ? 'error' : 'errors'}
            </div>
          )}
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || localMarks.length === 0 || totalErrors > 0}
            variant="premium"
          >
            <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {/* Selection Toolbar */}
      <div className="premium-card p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Class</label>
          <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setFieldErrors({}); }} className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none text-sm transition-all focus:ring-2 focus:ring-blue-500/10">
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Academic Term</label>
          <select value={selectedTerm} onChange={e => { setSelectedTerm(e.target.value); setFieldErrors({}); }} className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none text-sm transition-all focus:ring-2 focus:ring-blue-500/10">
            {terms.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.academicYear?.name})</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject of Learning</label>
          <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setFieldErrors({}); }} className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none text-sm transition-all focus:ring-2 focus:ring-blue-500/10">
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
      <div className="premium-card flex flex-col overflow-hidden">
        {loading ? (
          <div className="p-8 animate-pulse">
            <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center px-4 mb-4 gap-4">
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
            </div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-12 w-48 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                  <div className="h-12 flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg"></div>
                  <div className="h-12 w-20 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
        ) : localMarks.length === 0 ? (
          <div className="p-20 text-center text-slate-500">
            <ClipboardEdit className="w-16 h-16 mx-auto text-slate-100 mb-4" />
            <p className="text-lg font-bold text-slate-900 dark:text-white">Empty Roster</p>
            <p className="text-sm">No students were found in the selected class.</p>
          </div>
        ) : (
          <>
            {/* Status bar */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm flex-shrink-0">
              <div className="flex gap-3 text-sm font-medium flex-wrap items-center">
                <Badge variant="success">
                  {localMarks.filter(m => m.examScore > 0).length} Scored
                </Badge>
                <Badge variant="warning">
                  {localMarks.filter(m => !m.examScore).length} Pending
                </Badge>
                <span className="text-xs text-slate-400 font-medium">
                  {localMarks.length} students · CA fields max 25 · Exam max 100
                </span>
                {sortColumn && (
                  <Button variant="ghost" size="sm" onClick={() => { setSortColumn(null); setSortDir(null); }} className="h-6 text-[10px]">
                    ✕ Reset Sort
                  </Button>
                )}
              </div>
            </div>

            {/* Scrollable table: both horizontal AND vertical */}
            <div
              className="overflow-auto"
              style={{ maxHeight: '65vh' }}
            >
              <table className="data-table" style={{ minWidth: 900 }}>
                <thead className="sticky top-0 z-20">
                  <tr>
                    <th
                      onClick={() => handleSort('name')}
                      className={`sticky left-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-30 w-48 ${thClass('name')}`}
                    >
                      {settings?.studentLabel || 'Student Name'} <SortIcon col="name" sortColumn={sortColumn} sortDir={sortDir} />
                    </th>
                    <th onClick={() => handleSort('test1')} className={`text-center ${thClass('test1')}`} style={{ minWidth: colW }}>
                      {settings?.test1Label || 'Test 1'} <SortIcon col="test1" sortColumn={sortColumn} sortDir={sortDir} /><br />
                      <span className="text-[10px] font-black text-slate-400">(max 25)</span>
                    </th>
                    <th onClick={() => handleSort('assign1')} className={`text-center ${thClass('assign1')}`} style={{ minWidth: colW }}>
                      {settings?.assignment1Label || 'Assign 1'} <SortIcon col="assign1" sortColumn={sortColumn} sortDir={sortDir} /><br />
                      <span className="text-[10px] font-black text-slate-400">(max 25)</span>
                    </th>
                    <th onClick={() => handleSort('test2')} className={`text-center ${thClass('test2')}`} style={{ minWidth: colW }}>
                      {settings?.test2Label || 'Test 2'} <SortIcon col="test2" sortColumn={sortColumn} sortDir={sortDir} /><br />
                      <span className="text-[10px] font-black text-slate-400">(max 25)</span>
                    </th>
                    <th onClick={() => handleSort('assign2')} className={`text-center ${thClass('assign2')}`} style={{ minWidth: colW }}>
                      {settings?.assignment2Label || 'Assign 2'} <SortIcon col="assign2" sortColumn={sortColumn} sortDir={sortDir} /><br />
                      <span className="text-[10px] font-black text-slate-400">(max 25)</span>
                    </th>
                    <th onClick={() => handleSort('caSubtotal')} className={`text-center bg-blue-50/30 dark:bg-blue-900/5 ${thClass('caSubtotal')}`} style={{ minWidth: 100 }}>
                      {settings?.caSubtotalLabel || 'Subtotal'} <SortIcon col="caSubtotal" sortColumn={sortColumn} sortDir={sortDir} /><br />
                      <span className="text-[10px] font-black text-slate-400">(100)</span>
                    </th>
                    <th onClick={() => handleSort('ca40')} className={`text-center text-blue-600 ${thClass('ca40')}`} style={{ minWidth: 80 }}>
                      {settings?.caWeightLabel || 'CA'} {settings?.caWeight ?? 40}% <SortIcon col="ca40" sortColumn={sortColumn} sortDir={sortDir} />
                    </th>
                    <th onClick={() => handleSort('exam')} className={`text-center border-l border-slate-200 dark:border-slate-800 ${thClass('exam')}`} style={{ minWidth: colW }}>
                      {settings?.examLabel || 'Exam'} <SortIcon col="exam" sortColumn={sortColumn} sortDir={sortDir} /><br />
                      <span className="text-[10px] font-black text-slate-400">(max 100)</span>
                    </th>
                    <th onClick={() => handleSort('exam60')} className={`text-center text-blue-600 ${thClass('exam60')}`} style={{ minWidth: 80 }}>
                      {settings?.examWeightLabel || 'Exam'} {settings?.examWeight ?? 60}% <SortIcon col="exam60" sortColumn={sortColumn} sortDir={sortDir} />
                    </th>
                    <th onClick={() => handleSort('total')} className={`text-center font-bold border-l border-slate-200 dark:border-slate-800 ${thClass('total')}`} style={{ minWidth: 90 }}>
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
                    const rowHasError = Object.values(fieldErrors[m.studentId] || {}).some(e => !!e);

                    return (
                      <React.Fragment key={m.studentId}>
                        <tr className={`group ${rowHasError ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''}`}>
                          {/* Sticky student name */}
                          <td className={`font-bold sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.04)] ${rowHasError ? 'bg-rose-50 dark:bg-rose-950/20' : 'bg-white dark:bg-slate-900'}`}>
                            <div className="flex items-center justify-between min-w-[160px]">
                              <span className="truncate max-w-[130px] text-slate-900 dark:text-white text-sm">{m.studentName}</span>
                              {m.audits && m.audits.length > 0 && (
                                <Button
                                  variant="ghost" size="icon"
                                  onClick={() => toggleExpand(m.studentId)}
                                  className="h-7 w-7 text-slate-400 hover:text-blue-600 flex-shrink-0"
                                >
                                  {expandedStudents.includes(m.studentId) ? <ChevronUp className="w-3.5 h-3.5" /> : <History className="w-3.5 h-3.5" />}
                                </Button>
                              )}
                            </div>
                          </td>

                          {/* CA Inputs — max 25 each */}
                          <MarkInput value={m.test1} field="test1" studentId={m.studentId} onChange={handleMarkChange} onError={handleFieldError} hasError={hasFieldError(m.studentId, 'test1')} minWidth={colW} />
                          <MarkInput value={m.assignment1} field="assignment1" studentId={m.studentId} onChange={handleMarkChange} onError={handleFieldError} hasError={hasFieldError(m.studentId, 'assignment1')} minWidth={colW} />
                          <MarkInput value={m.test2} field="test2" studentId={m.studentId} onChange={handleMarkChange} onError={handleFieldError} hasError={hasFieldError(m.studentId, 'test2')} minWidth={colW} />
                          <MarkInput value={m.assignment2} field="assignment2" studentId={m.studentId} onChange={handleMarkChange} onError={handleFieldError} hasError={hasFieldError(m.studentId, 'assignment2')} minWidth={colW} />

                          {/* Computed CA columns */}
                          <td className="text-center font-bold text-slate-400 bg-slate-50/30 dark:bg-slate-900/10" style={{ minWidth: 100 }}>
                            <span className={subtotal > 100 ? 'text-rose-500' : ''}>{subtotal}</span>
                          </td>
                          <td className="text-center font-black text-blue-600 dark:text-blue-400" style={{ minWidth: 80 }}>{caContribution}</td>

                          {/* Exam Input — max 100 */}
                          <MarkInput value={m.examScore} field="examScore" studentId={m.studentId} onChange={handleMarkChange} onError={handleFieldError} hasError={hasFieldError(m.studentId, 'examScore')} minWidth={colW} className="font-black text-blue-700 dark:text-blue-300" />

                          <td className="text-center font-black text-blue-600 dark:text-blue-400" style={{ minWidth: 80 }}>{examContribution}</td>

                          {/* Final total + grade badge */}
                          <td className="text-center border-l border-slate-100 dark:border-slate-800" style={{ minWidth: 90 }}>
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-lg font-black gradient-text">{total}</span>
                              <GradeBadge grade={previewGrade || ''} className="scale-75 origin-top" />
                            </div>
                          </td>
                        </tr>

                        {/* Audit history drawer */}
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

            {/* Scroll hint for mobile */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex-shrink-0">
              <p className="text-[10px] text-slate-400 font-medium text-center">
                ← Scroll horizontally to see all columns · Scroll vertically to see all students →
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
