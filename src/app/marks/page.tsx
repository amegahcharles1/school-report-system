'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardEdit, Save, History, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

type SortDir = 'asc' | 'desc' | null;

export default function MarksEntryPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [expandedStudents, setExpandedStudents] = useState<string[]>([]);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/classes').then(res => res.json()),
      fetch('/api/terms').then(res => res.json()),
      fetch('/api/subjects').then(res => res.json()),
      fetch('/api/settings').then(res => res.json()),
    ]).then(([clsData, termData, subjData, settData]) => {
      setClasses(clsData);
      const activeTerms = termData.filter((t: any) => t.isCurrent);
      setTerms(activeTerms.length > 0 ? activeTerms : termData);
      setSubjects(subjData);
      setSettings(settData);
      if (clsData.length > 0) setSelectedClass(clsData[0].id);
      if (activeTerms.length > 0) setSelectedTerm(activeTerms[0].id);
      else if (termData.length > 0) setSelectedTerm(termData[0].id);
      if (subjData.length > 0) setSelectedSubject(subjData[0].id);
    });
  }, []);

  const loadMarks = async () => {
    if (!selectedClass || !selectedTerm || !selectedSubject) return;
    setLoading(true);
    // Reset sort on new load
    setSortColumn(null); setSortDir(null);
    try {
      const res = await fetch(`/api/marks?classId=${selectedClass}&termId=${selectedTerm}&subjectId=${selectedSubject}`);
      if (res.ok) setMarks(await res.json());
    } catch { toast.error('Failed to load marks'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedClass && selectedTerm && selectedSubject) loadMarks();
  }, [selectedClass, selectedTerm, selectedSubject]);

  const handleMarkChange = (studentId: string, field: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setMarks(prev => prev.map(m => m.studentId === studentId ? { ...m, [field]: numValue } : m));
  };

  const toggleExpand = (studentId: string) => {
    setExpandedStudents(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
  };

  const handleSaveMarks = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selectedSubject, termId: selectedTerm, marks }),
      });
      if (res.ok) toast.success('Marks saved successfully!');
      else toast.error('Failed to save marks');
    } catch { toast.error('Network error while saving'); }
    finally { setSaving(false); }
  };

  const calculateSubtotal = (m: any) => (m.test1 || 0) + (m.assignment1 || 0) + (m.test2 || 0) + (m.assignment2 || 0);
  const calculateTotal = (m: any) => {
    const ca = calculateSubtotal(m) * 0.4;
    const exam = (m.examScore || 0) * 0.6;
    return Math.round((ca + exam) * 100) / 100;
  };

  // Cycle sort: null → asc → desc → null
  const handleSort = (col: string) => {
    if (sortColumn !== col) { setSortColumn(col); setSortDir('asc'); return; }
    if (sortDir === 'asc') { setSortDir('desc'); return; }
    if (sortDir === 'desc') { setSortColumn(null); setSortDir(null); }
  };

  // Compute sorted marks
  const sortedMarks = useMemo(() => {
    if (!sortColumn || !sortDir) return marks;
    return [...marks].sort((a, b) => {
      let valA: any, valB: any;
      const subtotalA = calculateSubtotal(a);
      const subtotalB = calculateSubtotal(b);
      switch (sortColumn) {
        case 'name':      valA = a.studentName?.toLowerCase(); valB = b.studentName?.toLowerCase(); break;
        case 'test1':     valA = a.test1 || 0; valB = b.test1 || 0; break;
        case 'assign1':   valA = a.assignment1 || 0; valB = b.assignment1 || 0; break;
        case 'test2':     valA = a.test2 || 0; valB = b.test2 || 0; break;
        case 'assign2':   valA = a.assignment2 || 0; valB = b.assignment2 || 0; break;
        case 'caSubtotal': valA = subtotalA; valB = subtotalB; break;
        case 'ca40':      valA = subtotalA * 0.4; valB = subtotalB * 0.4; break;
        case 'exam':      valA = a.examScore || 0; valB = b.examScore || 0; break;
        case 'exam60':    valA = (a.examScore || 0) * 0.6; valB = (b.examScore || 0) * 0.6; break;
        case 'total':     valA = calculateTotal(a); valB = calculateTotal(b); break;
        default:          return 0;
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [marks, sortColumn, sortDir]);

  // Sort icon component
  const SortIcon = ({ col }: { col: string }) => {
    if (sortColumn !== col) return <ChevronsUpDown className="w-3 h-3 text-gray-300 inline ml-1" />;
    if (sortDir === 'asc') return <ChevronUp className="w-3 h-3 text-blue-500 inline ml-1" />;
    return <ChevronDown className="w-3 h-3 text-blue-500 inline ml-1" />;
  };

  const thClass = (col: string) =>
    `cursor-pointer select-none hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${sortColumn === col ? 'text-blue-600 dark:text-blue-400' : ''}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ClipboardEdit className="w-6 h-6 text-blue-600" /> Marks Entry
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Record continuous assessment and exam scores · Click any column header to sort</p>
      </div>

      {/* Selection Toolbar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500">
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Term</label>
          <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500">
            {terms.map(t => <option key={t.id} value={t.id}>{t.name} ({t.academicYear?.name})</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Subject</label>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500">
            {subjects
              .filter(s => s.subjectAssignments?.some((sa: any) => sa.classId === selectedClass))
              .filter(s => {
                const isClassTeacher = classes.find(c => c.id === selectedClass)?.classTeacherId === userId;
                if (isClassTeacher) return true;
                if (s.teacherAssignments) return s.teacherAssignments.some((ta: any) => ta.classId === selectedClass);
                return true;
              })
              .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading student roster...</div>
        ) : marks.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No students found. Add students to this class first.</div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex gap-3 text-sm font-medium flex-wrap">
                <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {marks.filter(m => m.status === 'COMPLETED').length} Completed
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {marks.filter(m => m.status !== 'COMPLETED').length} Missing
                </span>
                {sortColumn && (
                  <button onClick={() => { setSortColumn(null); setSortDir(null); }}
                    className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 text-xs">
                    ✕ Clear sort
                  </button>
                )}
              </div>
              <button
                onClick={handleSaveMarks}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50 whitespace-nowrap"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Marks'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')} className={`sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 w-48 ${thClass('name')}`}>
                      {settings?.studentLabel || 'Student Name'} <SortIcon col="name" />
                    </th>
                    <th onClick={() => handleSort('test1')} className={`text-center ${thClass('test1')}`} style={{ minWidth: settings?.columnWidth || 100 }}>
                      {settings?.test1Label || 'Test 1'} <SortIcon col="test1" /><br /><span className="text-xs font-normal text-gray-400">(25)</span>
                    </th>
                    <th onClick={() => handleSort('assign1')} className={`text-center ${thClass('assign1')}`} style={{ minWidth: settings?.columnWidth || 100 }}>
                      {settings?.assignment1Label || 'Assign 1'} <SortIcon col="assign1" /><br /><span className="text-xs font-normal text-gray-400">(25)</span>
                    </th>
                    <th onClick={() => handleSort('test2')} className={`text-center ${thClass('test2')}`} style={{ minWidth: settings?.columnWidth || 100 }}>
                      {settings?.test2Label || 'Test 2'} <SortIcon col="test2" /><br /><span className="text-xs font-normal text-gray-400">(25)</span>
                    </th>
                    <th onClick={() => handleSort('assign2')} className={`text-center ${thClass('assign2')}`} style={{ minWidth: settings?.columnWidth || 100 }}>
                      {settings?.assignment2Label || 'Assign 2'} <SortIcon col="assign2" /><br /><span className="text-xs font-normal text-gray-400">(25)</span>
                    </th>
                    <th onClick={() => handleSort('caSubtotal')} className={`text-center bg-blue-50/50 dark:bg-blue-900/10 ${thClass('caSubtotal')}`} style={{ minWidth: 100 }}>
                      {settings?.caSubtotalLabel || 'CA Subtotal'} <SortIcon col="caSubtotal" /><br /><span className="text-xs font-normal text-gray-400">(100)</span>
                    </th>
                    <th onClick={() => handleSort('ca40')} className={`text-center text-blue-600 ${thClass('ca40')}`} style={{ minWidth: 80 }}>
                      {settings?.caWeightLabel || 'CA'} {settings?.caWeight || 40}% <SortIcon col="ca40" /><br /><span className="text-xs font-normal text-blue-400">({settings?.caWeight || 40})</span>
                    </th>
                    <th onClick={() => handleSort('exam')} className={`text-center border-l border-gray-200 dark:border-gray-700 ${thClass('exam')}`} style={{ minWidth: settings?.columnWidth || 100 }}>
                      {settings?.examLabel || 'Exam'} <SortIcon col="exam" /><br /><span className="text-xs font-normal text-gray-400">(100)</span>
                    </th>
                    <th onClick={() => handleSort('exam60')} className={`text-center text-blue-600 ${thClass('exam60')}`} style={{ minWidth: 80 }}>
                      {settings?.examWeightLabel || 'Exam'} {settings?.examWeight || 60}% <SortIcon col="exam60" /><br /><span className="text-xs font-normal text-blue-400">({settings?.examWeight || 60})</span>
                    </th>
                    <th onClick={() => handleSort('total')} className={`text-center font-bold border-l border-gray-200 dark:border-gray-700 ${thClass('total')}`}>
                      {settings?.finalTotalLabel || 'Final Total'} <SortIcon col="total" /><br /><span className="text-xs font-normal text-gray-400">(100%)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMarks.map((m, idx) => {
                    const subtotal = calculateSubtotal(m);
                    const caWeight = settings?.caWeight || 40;
                    const examWeight = settings?.examWeight || 60;
                    const caContribution = Math.round(subtotal * (caWeight / 100) * 100) / 100;
                    const examContribution = Math.round((m.examScore || 0) * (examWeight / 100) * 100) / 100;
                    const total = Math.round((caContribution + examContribution) * 100) / 100;

                    return (
                      <React.Fragment key={m.studentId}>
                        <tr className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/30 dark:bg-gray-800/30'}>
                          <td className="font-medium sticky left-0 bg-inherit z-10">
                            <div className="flex items-center justify-between">
                              <span className="truncate max-w-[160px]">{m.studentName}</span>
                              {m.audits && m.audits.length > 0 && (
                                <button
                                  onClick={() => toggleExpand(m.studentId)}
                                  className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ms-2 flex-shrink-0"
                                  title="View Edit History"
                                >
                                  {expandedStudents.includes(m.studentId) ? <ChevronUp className="w-4 h-4" /> : <History className="w-4 h-4" />}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-1" style={{ minWidth: settings?.columnWidth || 100 }}>
                            <input type="number" min="0" max="25" step="0.1" value={m.test1 || ''} onChange={e => handleMarkChange(m.studentId, 'test1', e.target.value)} className="w-full text-center p-2 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white dark:focus:bg-gray-800 outline-none transition-all" />
                          </td>
                          <td className="p-1" style={{ minWidth: settings?.columnWidth || 100 }}>
                            <input type="number" min="0" max="25" step="0.1" value={m.assignment1 || ''} onChange={e => handleMarkChange(m.studentId, 'assignment1', e.target.value)} className="w-full text-center p-2 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white dark:focus:bg-gray-800 outline-none transition-all" />
                          </td>
                          <td className="p-1" style={{ minWidth: settings?.columnWidth || 100 }}>
                            <input type="number" min="0" max="25" step="0.1" value={m.test2 || ''} onChange={e => handleMarkChange(m.studentId, 'test2', e.target.value)} className="w-full text-center p-2 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white dark:focus:bg-gray-800 outline-none transition-all" />
                          </td>
                          <td className="p-1" style={{ minWidth: settings?.columnWidth || 100 }}>
                            <input type="number" min="0" max="25" step="0.1" value={m.assignment2 || ''} onChange={e => handleMarkChange(m.studentId, 'assignment2', e.target.value)} className="w-full text-center p-2 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white dark:focus:bg-gray-800 outline-none transition-all" />
                          </td>
                          <td className="text-center font-medium text-gray-600 dark:text-gray-400 bg-blue-50/50 dark:bg-blue-900/10" style={{ minWidth: 100 }}>{subtotal}</td>
                          <td className="text-center font-bold text-blue-600 dark:text-blue-400" style={{ minWidth: 80 }}>{caContribution}</td>
                          <td className="p-1 border-l border-gray-200 dark:border-gray-700" style={{ minWidth: settings?.columnWidth || 100 }}>
                            <input type="number" min="0" max="100" step="0.1" value={m.examScore || ''} onChange={e => handleMarkChange(m.studentId, 'examScore', e.target.value)} className="w-full text-center p-2 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white dark:focus:bg-gray-800 outline-none transition-all font-semibold" />
                          </td>
                          <td className="text-center font-bold text-blue-600 dark:text-blue-400" style={{ minWidth: 80 }}>{examContribution}</td>
                          <td className="text-center font-black text-gray-900 dark:text-white border-l border-gray-200 dark:border-gray-700">{total}</td>
                        </tr>
                        {expandedStudents.includes(m.studentId) && (
                          <tr className="bg-gray-50 dark:bg-gray-800/80 border-y border-gray-200 dark:border-gray-700 shadow-inner">
                            <td colSpan={10} className="p-4">
                              <div className="flex flex-col gap-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                  <History className="w-3 h-3" /> Audit Trail for {m.studentName}
                                </h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                  {m.audits?.map((audit: any) => (
                                    <div key={audit.id} className="flex flex-wrap items-center gap-2 text-xs bg-white dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm">
                                      <span className="text-gray-400 w-32 shrink-0">{new Date(audit.createdAt).toLocaleString()}</span>
                                      <span className="font-semibold text-gray-700 dark:text-gray-300 w-32 truncate">{audit.modifiedBy?.name || 'User'}</span>
                                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium border border-blue-100 dark:border-blue-800">Field: {audit.field}</span>
                                      <div className="flex items-center gap-1.5 ms-2">
                                        {audit.oldValue !== null && <span className="text-red-500 line-through font-medium">{audit.oldValue}</span>}
                                        {audit.oldValue !== null && <span className="text-gray-300">→</span>}
                                        <span className="text-green-600 font-bold">{audit.newValue}</span>
                                      </div>
                                      {audit.reason && <span className="text-gray-400 italic ms-auto">"{audit.reason}"</span>}
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
