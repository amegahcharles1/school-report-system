'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ClipboardEdit, Save, History, ChevronDown, ChevronUp, ChevronsUpDown, AlertCircle, Search, ArrowLeft, ArrowRight, List, User } from 'lucide-react';
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
  readOnly?: boolean;
};

function MarkInput({ value, field, studentId, onChange, onError, hasError, minWidth = 100, className = '', readOnly = false }: MarkInputProps) {
  const max = FIELD_MAX[field] ?? 100;
  // Use empty string instead of 0 for blank placeholder
  const [raw, setRaw] = useState<string>(value > 0 ? String(value) : '');

  React.useEffect(() => {
    setRaw(value > 0 ? String(value) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const val = e.target.value;

    // Reject non-numeric input early
    if (val !== '' && !/^\d*\.?\d*$/.test(val)) {
      onError(studentId, field, 'Numbers only. No letters or symbols.');
      return;
    }

    setRaw(val);

    if (val === '') {
      onChange(studentId, field, '');
      onError(studentId, field, null);
      return;
    }

    const num = parseFloat(val);
    if (isNaN(num)) {
      onError(studentId, field, 'Not a number');
      return;
    }

    if (num < 0) {
      onError(studentId, field, `Cannot be negative`);
    } else if (num > max) {
      onError(studentId, field, `Max is ${max}`);
    } else {
      onError(studentId, field, null);
    }
    onChange(studentId, field, val);
  };

  const handleBlur = () => {
    if (readOnly) return;
    if (raw === '') {
      onChange(studentId, field, '');
      onError(studentId, field, null);
      return;
    }
    let num = parseFloat(raw);
    if (isNaN(num) || num < 0) {
      onError(studentId, field, isNaN(num) ? 'Invalid number' : 'Cannot be negative');
      return;
    }
    if (num > max) {
      onError(studentId, field, `Max is ${max}`);
      return;
    }
    const clamped = String(Math.round(num * 10) / 10);
    setRaw(clamped);
    onChange(studentId, field, clamped);
    onError(studentId, field, null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (readOnly) return;
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
  };

  const borderColor = hasError
    ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 focus:border-rose-500'
    : 'border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950';

  return (
    <td className="p-0.5 relative" style={{ minWidth }}>
      <input
        type="text"
        inputMode="decimal"
        value={raw}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        placeholder="-"
        className={`w-full text-center py-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 outline-none transition-all font-medium border-2 rounded ${borderColor} ${readOnly ? 'opacity-70 bg-slate-100 cursor-not-allowed border-transparent' : ''} ${className}`}
      />
      {hasError && (
        <div className="absolute top-1 right-2 z-20">
          <AlertCircle className="w-4 h-4 text-rose-500" />
        </div>
      )}
    </td>
  );
}

// Student selector dropdown component
function StudentDropdown({ students, selectedId, onSelect }: { students: MarksEntry[], selectedId: string | null, onSelect: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = students.filter(s => s.studentName.toLowerCase().includes(search.toLowerCase()));
  const selectedStudent = students.find(s => s.studentId === selectedId);

  return (
    <div className="relative w-full max-w-sm" ref={containerRef}>
      <div 
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer shadow-sm"
      >
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {selectedStudent ? selectedStudent.studentName : 'Select a student...'}
        </span>
        <ChevronDown className="w-5 h-5 text-slate-400" />
      </div>
      
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent outline-none text-sm p-1"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">No student found</div>
            ) : (
              filtered.map(s => (
                <div 
                  key={s.studentId}
                  onClick={() => {
                    onSelect(s.studentId);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors ${s.studentId === selectedId ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30' : 'text-slate-700 dark:text-slate-300'}`}
                >
                  {s.studentName}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarksEntryPage() {
  type SessionUser = { id?: string; role?: string };
  const { data: session } = useSession();
  const userId = (session?.user as SessionUser)?.id;
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<string[]>([]);
  const [localMarks, setLocalMarks] = useState<MarksEntry[]>([]);
  const [dirtyStudentIds, setDirtyStudentIds] = useState<Set<string>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, Record<string, string>>>({});

  // Sorting state for all students mode
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
      setFieldErrors({});
      setDirtyStudentIds(new Set());
      
      // Auto-select first student if available and single mode is active
      if (data && data.length > 0 && !selectedStudentId) {
        setSelectedStudentId(data[0].studentId);
      }
      return data;
    },
    enabled: !!selectedClass && !!selectedTerm && !!selectedSubject
  });

  // Calculate generic logic
  const calculateSubtotal = (m: MarksEntry) => (m.test1 || 0) + (m.assignment1 || 0) + (m.test2 || 0) + (m.assignment2 || 0);
  const calculateTotal = (m: MarksEntry) => {
    const caWeight = settings?.caWeight ?? 40;
    const examWeight = settings?.examWeight ?? 60;
    const ca = calculateSubtotal(m) * (caWeight / 100);
    const exam = (m.examScore || 0) * (examWeight / 100);
    return Math.round((ca + exam) * 100) / 100;
  };

  const calculateCA40 = (m: MarksEntry) => {
    const caWeight = settings?.caWeight ?? 40;
    return Math.round(calculateSubtotal(m) * (caWeight / 100) * 100) / 100;
  };

  const calculateExam60 = (m: MarksEntry) => {
    const examWeight = settings?.examWeight ?? 60;
    return Math.round((m.examScore || 0) * (examWeight / 100) * 100) / 100;
  };

  // Precompute rankings
  const rankings = useMemo(() => {
    const studentTotals = localMarks.map(st => ({ id: st.studentId, total: calculateTotal(st) }));
    studentTotals.sort((a, b) => b.total - a.total);
    
    const rankMap = new Map();
    let currentRank = 1;
    for (let i = 0; i < studentTotals.length; i++) {
        // Adjust for ties
      if (i > 0 && studentTotals[i].total < studentTotals[i-1].total) {
        currentRank = i + 1;
      }
      rankMap.set(studentTotals[i].id, currentRank);
    }
    return rankMap;
  }, [localMarks, settings]);

  const getPosition = (studentId: string) => {
    const pos = rankings.get(studentId);
    if (!pos) return '-';
    const num = String(pos);
    const last = num[num.length - 1];
    let ext = 'th';
    if (num.length < 2 || num[num.length - 2] !== '1') {
      if (last === '1') ext = 'st';
      if (last === '2') ext = 'nd';
      if (last === '3') ext = 'rd';
    }
    return `${pos}${ext}`;
  };

  // Save Mutations
  const saveAllMutation = useMutation({
    mutationFn: async () => {
      const hasErrors = Object.values(fieldErrors).some(fields => Object.values(fields).some(err => !!err));
      if (hasErrors) throw new Error('Fix validation errors before saving');

      const changedMarks = localMarks.filter(m => dirtyStudentIds.has(m.studentId));
      if (changedMarks.length === 0) {
        toast.error('No changes detected to save');
        return;
      }

      const res = await fetch('/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selectedSubject, termId: selectedTerm, marks: changedMarks }),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Marks updated and synced!');
      setDirtyStudentIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['marks'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Check your network and try again.')
  });

  const saveSingleMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const errors = fieldErrors[studentId] || {};
      const hasErrors = Object.values(errors).some(err => !!err);
      if (hasErrors) throw new Error('Fix validation errors on this student before saving');
      
      const st = localMarks.find(m => m.studentId === studentId);
      if (!st) throw new Error('Student data not found');

      const res = await fetch('/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selectedSubject, termId: selectedTerm, marks: [st] }),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: (_, studentId) => {
      toast.success('Student marks saved successfully!');
      setDirtyStudentIds(prev => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['marks'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Check your network and try again.')
  });


  const handleMarkChange = useCallback((studentId: string, field: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setLocalMarks(prev => prev.map(m => m.studentId === studentId ? { ...m, [field]: isNaN(numValue) ? 0 : numValue } : m));
    setDirtyStudentIds(prev => new Set(prev).add(studentId));
  }, []);

  const handleFieldError = useCallback((studentId: string, field: string, err: string | null) => {
    setFieldErrors(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [field]: err || '' }
    }));
  }, []);

  const hasFieldError = (studentId: string, field: string) => !!(fieldErrors[studentId]?.[field]);
  const getFieldErrorMsg = (studentId: string, field: string) => fieldErrors[studentId]?.[field];

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
    `cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap p-4 ${sortColumn === col ? 'text-blue-600 dark:text-blue-400' : ''}`;

  // Single mode navigation
  const currentIndex = selectedStudentId ? localMarks.findIndex(m => m.studentId === selectedStudentId) : -1;
  const goPrev = () => {
    if (currentIndex > 0) setSelectedStudentId(localMarks[currentIndex - 1].studentId);
  };
  const goNext = () => {
    if (currentIndex < localMarks.length - 1) setSelectedStudentId(localMarks[currentIndex + 1].studentId);
  };

  const selectedStudentData = localMarks.find(m => m.studentId === selectedStudentId);

  // Summaries
  const displayClass = classes.find(c => c.id === selectedClass)?.name || '';
  const displaySubject = subjects.find(s => s.id === selectedSubject)?.name || '';
  const displayTerm = terms.find(t => t.id === selectedTerm) || null;

  return (
    <div className="space-y-6 animate-fade-in mb-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardEdit className="w-6 h-6 text-blue-600" /> {settings?.marksEntryLabel || 'Marks Entry'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Record continuous assessment and exam scores with strict validation
          </p>
        </div>
      </div>

      {/* Target Selection Area */}
      <div className="premium-card p-4 flex flex-col md:flex-row gap-4 align-middle bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Target Class</label>
          <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setFieldErrors({}); }} className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-800 outline-none text-sm focus:border-blue-500">
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Academic Term</label>
          <select value={selectedTerm} onChange={e => { setSelectedTerm(e.target.value); setFieldErrors({}); }} className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-800 outline-none text-sm focus:border-blue-500">
            {terms.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.academicYear?.name})</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Subject of Learning</label>
          <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setFieldErrors({}); }} className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-800 outline-none text-sm focus:border-blue-500">
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

      {/* View Mode Toggle */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mb-4">
        <button 
          onClick={() => setViewMode('single')} 
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'single' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
        >
          <User className="w-4 h-4" /> Single Student
        </button>
        <button 
          onClick={() => setViewMode('all')} 
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
        >
          <List className="w-4 h-4" /> All Students
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center animate-pulse tracking-widest font-bold text-slate-400">LOADING ROSTER...</div>
      ) : localMarks.length === 0 ? (
        <div className="p-20 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
          <p className="font-bold">No students found for this selection.</p>
        </div>
      ) : viewMode === 'single' ? (
        /* ================= SINGLE STUDENT MODE ================= */
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* Form Area */}
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden w-full">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold">Marks Entry Form</h2>
              {selectedStudentData && dirtyStudentIds.has(selectedStudentData.studentId) && (
                 <Button onClick={() => saveSingleMutation.mutate(selectedStudentData.studentId)} disabled={saveSingleMutation.isPending} variant="premium" className="h-9 px-4 text-sm">
                   {saveSingleMutation.isPending ? 'Saving...' : 'Save Student'}
                 </Button>
              )}
            </div>

            <div className="p-6 space-y-8">
              {/* Student Selector Row */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button onClick={goPrev} disabled={currentIndex <= 0} className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition">
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1 mx-4 max-w-sm">
                  <StudentDropdown students={localMarks} selectedId={selectedStudentId} onSelect={setSelectedStudentId} />
                </div>
                <button onClick={goNext} disabled={currentIndex >= localMarks.length - 1} className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition">
                  <ArrowRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Editable Fields Vertical List */}
              {selectedStudentData && (
                <div className="flex flex-col gap-6 max-w-xl mx-auto">
                  
                  {/* Field Layout Definition */}
                  {[
                    { key: 'test1', label: settings?.test1Label || 'Test 1', max: 25 },
                    { key: 'assignment1', label: settings?.assignment1Label || 'Assignment 1', max: 25 },
                    { key: 'test2', label: settings?.test2Label || 'Test 2', max: 25 },
                    { key: 'assignment2', label: settings?.assignment2Label || 'Assignment 2', max: 25 },
                    { key: 'caSubtotal', label: settings?.caSubtotalLabel || 'CA Subtotal', calculated: calculateSubtotal(selectedStudentData), highlight: true },
                    { key: 'ca40', label: `${settings?.caWeightLabel || 'CA'} ${settings?.caWeight ?? 40}%`, calculated: calculateCA40(selectedStudentData) },
                    { key: 'examScore', label: settings?.examLabel || 'Exam', max: 100 },
                    { key: 'exam60', label: `${settings?.examWeightLabel || 'Exam'} ${settings?.examWeight ?? 60}%`, calculated: calculateExam60(selectedStudentData) },
                    { key: 'total', label: settings?.finalTotalLabel || 'Final Total', calculated: calculateTotal(selectedStudentData), xl: true },
                    { key: 'position', label: 'Position', calculated: getPosition(selectedStudentData.studentId), xl: true, isText: true }
                  ].map((fieldData, idx) => {
                    const isCalculated = fieldData.calculated !== undefined;
                    const errorMsg = getFieldErrorMsg(selectedStudentData.studentId, fieldData.key);
                    const rawValue = isCalculated ? fieldData.calculated : selectedStudentData[fieldData.key as keyof MarksEntry];

                    return (
                      <div key={idx} className={`flex items-center justify-between gap-6 ${isCalculated ? 'bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800' : ''}`}>
                        <label className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest w-40 flex flex-col">
                          {fieldData.label}
                          {fieldData.max && <span className="text-slate-400 normal-case font-medium text-xs mt-1">(max {fieldData.max})</span>}
                        </label>
                        
                        <div className="flex-1 flex flex-col items-end">
                        {isCalculated ? (
                          <div className={`text-xl font-bold ${fieldData.xl ? 'text-blue-600 text-3xl' : 'text-slate-700 dark:text-slate-300'}`}>
                            {fieldData.calculated}
                          </div>
                        ) : (
                          <div className="relative w-full max-w-[200px]">
                            <input 
                              type="text"
                              value={rawValue === 0 && !dirtyStudentIds.has(selectedStudentData.studentId) ? '' : rawValue}
                              placeholder="-"
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val !== '' && !/^\d*\.?\d*$/.test(val)) {
                                  handleFieldError(selectedStudentData.studentId, fieldData.key, 'Numbers only. No letters or symbols.');
                                  return;
                                }
                                handleMarkChange(selectedStudentData.studentId, fieldData.key, val);
                                if (val === '') {
                                  handleFieldError(selectedStudentData.studentId, fieldData.key, null);
                                  return;
                                }
                                const num = parseFloat(val);
                                if (isNaN(num)) handleFieldError(selectedStudentData.studentId, fieldData.key, 'Invalid number');
                                else if (num < 0) handleFieldError(selectedStudentData.studentId, fieldData.key, 'Cannot be negative');
                                else if (fieldData.max && num > fieldData.max) handleFieldError(selectedStudentData.studentId, fieldData.key, `Max allowed is ${fieldData.max}`);
                                else handleFieldError(selectedStudentData.studentId, fieldData.key, null);
                              }}
                              className={`w-full text-center text-lg py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 transition-all outline-none 
                                ${errorMsg ? 'border-rose-400 focus:border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-700' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white'}`}
                            />
                            {errorMsg && (
                              <div className="text-[10px] text-rose-500 mt-1.5 flex justify-end items-center gap-1 font-semibold absolute top-full right-0 w-full text-right">
                                <AlertCircle className="w-3 h-3" /> {errorMsg}
                              </div>
                            )}
                          </div>
                        )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Summary */}
          {selectedStudentData && (
            <div className="w-full md:w-72 flex-shrink-0 bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
              <h3 className="font-bold text-lg mb-4 text-blue-900 dark:text-blue-100">Details</h3>
              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                <div><span className="text-slate-500 font-medium block text-xs">Name</span> <span className="font-bold text-base">{selectedStudentData.studentName}</span></div>
                <div><span className="text-slate-500 font-medium block text-xs">Class</span> {displayClass}</div>
                <div><span className="text-slate-500 font-medium block text-xs">Subject</span> {displaySubject}</div>
                <div><span className="text-slate-500 font-medium block text-xs">Academic Year</span> {displayTerm?.academicYear?.name}</div>
                <div><span className="text-slate-500 font-medium block text-xs">Term</span> {displayTerm?.name}</div>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* ================= ALL STUDENTS MODE ================= */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          
          <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-bold text-slate-700 dark:text-white">Class Table View</h2>
            <Button
              onClick={() => saveAllMutation.mutate()}
              disabled={saveAllMutation.isPending || localMarks.length === 0}
              variant="premium"
              className="h-8 text-xs px-4"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" /> {saveAllMutation.isPending ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>

          <div className="overflow-auto relative" style={{ maxHeight: '72vh' }}>
            <table className="data-table text-sm" style={{ minWidth: 1000 }}>
              <thead className="sticky top-0 z-20 shadow-sm border-b-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                <tr className="text-slate-600 dark:text-slate-300 items-end">
                  <th onClick={() => handleSort('name')} className={`sticky left-0 bg-slate-100 dark:bg-slate-800 z-30 min-w-[200px] text-left align-bottom pb-4 pl-4 ${thClass('name')}`}>
                    {settings?.studentLabel || 'Student Name'} <SortIcon col="name" sortColumn={sortColumn} sortDir={sortDir} />
                  </th>
                  
                  {/* Vertical Headers */}
                  <th onClick={() => handleSort('test1')} className={`text-center align-bottom p-0 border-l border-slate-200 w-16 px-1`} title="max 25">
                    <div className="writing-vertical -rotate-180 transform translate-y-2 h-32 mx-auto text-xs font-bold w-full whitespace-nowrap">
                      {settings?.test1Label || 'Test 1'} (25)
                    </div>
                  </th>
                  <th onClick={() => handleSort('assign1')} className={`text-center align-bottom p-0 border-l border-slate-200 w-16 px-1`} title="max 25">
                    <div className="writing-vertical -rotate-180 transform translate-y-2 h-32 mx-auto text-xs font-bold w-full whitespace-nowrap">
                      {settings?.assignment1Label || 'Assign 1'} (25)
                    </div>
                  </th>
                  <th onClick={() => handleSort('test2')} className={`text-center align-bottom p-0 border-l border-slate-200 w-16 px-1`} title="max 25">
                    <div className="writing-vertical -rotate-180 transform translate-y-2 h-32 mx-auto text-xs font-bold w-full whitespace-nowrap">
                      {settings?.test2Label || 'Test 2'} (25)
                    </div>
                  </th>
                  <th onClick={() => handleSort('assign2')} className={`text-center align-bottom p-0 border-l border-slate-200 w-16 px-1`} title="max 25">
                    <div className="writing-vertical -rotate-180 transform translate-y-2 h-32 mx-auto text-xs font-bold w-full whitespace-nowrap">
                      {settings?.assignment2Label || 'Assign 2'} (25)
                    </div>
                  </th>
                  
                  {/* Summary/Calculated columns with normal headers or slightly compact */}
                  <th className="text-center font-bold bg-blue-50/50 dark:bg-blue-900/10 min-w-[80px] align-bottom pb-4 border-l border-slate-200">
                    Sub<br/><span className="text-[10px] font-normal">(100)</span>
                  </th>
                  <th className="text-center font-bold text-blue-600 min-w-[80px] align-bottom pb-4 border-l border-slate-200">
                    CA<br/>{settings?.caWeight ?? 40}%
                  </th>
                  
                  <th onClick={() => handleSort('exam')} className={`text-center align-bottom p-0 border-l border-slate-200 w-16 px-1`} title="max 100">
                    <div className="writing-vertical -rotate-180 transform translate-y-2 h-32 mx-auto text-xs font-bold w-full whitespace-nowrap">
                      {settings?.examLabel || 'Exam'} (100)
                    </div>
                  </th>
                  
                  <th className="text-center font-bold text-blue-600 min-w-[80px] align-bottom pb-4 border-l border-slate-200">
                    Exam<br/>{settings?.examWeight ?? 60}%
                  </th>
                  <th className="text-center font-black min-w-[90px] border-l border-slate-200 align-bottom pb-4 border-slate-300">
                    Total<br/><span className="text-[10px] font-normal">(100)</span>
                  </th>
                  <th className="text-center font-black min-w-[70px] align-bottom pb-4 border-l border-slate-200">Pos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedMarks.map((m) => {
                  const subtotal = calculateSubtotal(m);
                  const caContribution = calculateCA40(m);
                  const examContribution = calculateExam60(m);
                  const total = calculateTotal(m);
                  const pos = getPosition(m.studentId);
                  const rowHasError = Object.values(fieldErrors[m.studentId] || {}).some(e => !!e);

                  return (
                    <tr key={m.studentId} className={`group hover:bg-slate-50 dark:hover:bg-slate-800 ${rowHasError ? 'bg-rose-50/20 dark:bg-rose-900/10' : ''}`}>
                      <td className="sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 font-bold px-4 py-2 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-r border-slate-100 dark:border-slate-800">
                         {m.studentName}
                         {rowHasError && <AlertCircle className="w-3.5 h-3.5 text-rose-500 inline ml-2" title="Validation errors in this row" />}
                      </td>
                      <MarkInput value={m.test1} field="test1" studentId={m.studentId} onChange={handleMarkChange} onError={handleFieldError} hasError={hasFieldError(m.studentId, 'test1')} minWidth={60} />
                      <MarkInput value={m.assignment1} field="assignment1" studentId={m.studentId} onChange={handleMarkChange} onError={handleFieldError} hasError={hasFieldError(m.studentId, 'assignment1')} minWidth={60} />
                      <MarkInput value={m.test2} field="test2" studentId={m.studentId} onChange={handleMarkChange} onError={handleFieldError} hasError={hasFieldError(m.studentId, 'test2')} minWidth={60} />
                      <MarkInput value={m.assignment2} field="assignment2" studentId={m.studentId} onChange={handleMarkChange} onError={handleFieldError} hasError={hasFieldError(m.studentId, 'assignment2')} minWidth={60} />
                      <td className="text-center border-l font-bold text-slate-500 bg-slate-50/50 dark:bg-slate-900/10">{subtotal}</td>
                      <td className="text-center border-l font-bold text-blue-600">{caContribution}</td>
                      <MarkInput value={m.examScore} field="examScore" studentId={m.studentId} onChange={handleMarkChange} onError={handleFieldError} hasError={hasFieldError(m.studentId, 'examScore')} minWidth={60} className="font-bold text-blue-700 bg-white" />
                      <td className="text-center border-l font-bold text-blue-600">{examContribution}</td>
                      <td className="text-center border-l font-black text-lg text-slate-700">{total}</td>
                      <td className="text-center border-l font-black text-slate-500">{pos}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Required style for vertical text */}
      <style dangerouslySetInnerHTML={{__html: `
        .writing-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}} />
    </div>
  );
}
