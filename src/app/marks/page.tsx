'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardEdit, Save, History, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

export default function MarksEntryPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;

  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Track which student rows are expanded for audit trail viewing
  const [expandedStudents, setExpandedStudents] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/classes').then(res => res.json()),
      fetch('/api/terms').then(res => res.json()),
      fetch('/api/subjects').then(res => res.json())
    ]).then(([clsData, termData, subjData]) => {
      setClasses(clsData);
      
      // Lock to Second Term (isCurrent)
      const activeTerms = termData.filter((t: any) => t.isCurrent);
      setTerms(activeTerms.length > 0 ? activeTerms : termData);
      
      setSubjects(subjData);
      
      if (clsData.length > 0) setSelectedClass(clsData[0].id);
      if (activeTerms.length > 0) {
        setSelectedTerm(activeTerms[0].id);
      } else if (termData.length > 0) {
        setSelectedTerm(termData[0].id);
      }
      
      if (subjData.length > 0) setSelectedSubject(subjData[0].id);
    });
  }, []);

  const loadMarks = async () => {
    if (!selectedClass || !selectedTerm || !selectedSubject) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/marks?classId=${selectedClass}&termId=${selectedTerm}&subjectId=${selectedSubject}`);
      if (res.ok) {
        setMarks(await res.json());
      }
    } catch (error) {
      toast.error('Failed to load marks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedTerm && selectedSubject) {
      loadMarks();
    }
  }, [selectedClass, selectedTerm, selectedSubject]);

  const handleMarkChange = (studentId: string, field: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setMarks(prev => prev.map(m => 
      m.studentId === studentId ? { ...m, [field]: numValue } : m
    ));
  };

  const toggleExpand = (studentId: string) => {
    setExpandedStudents(prev => 
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSaveMarks = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: selectedSubject,
          termId: selectedTerm,
          marks
        })
      });
      if (res.ok) {
        toast.success('Marks saved successfully!');
      } else {
        toast.error('Failed to save marks');
      }
    } catch (error) {
      toast.error('Network error while saving');
    } finally {
      setSaving(false);
    }
  };

  const calculateSubtotal = (m: any) => (m.test1 || 0) + (m.assignment1 || 0) + (m.test2 || 0) + (m.assignment2 || 0);
  const calculateTotal = (m: any) => {
    const ca = calculateSubtotal(m) * 0.4;
    const exam = (m.examScore || 0) * 0.6;
    return Math.round((ca + exam) * 100) / 100;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ClipboardEdit className="w-6 h-6 text-blue-600" /> Marks Entry
        </h1>
        <p className="text-gray-500 mt-1">Record continuous assessment and exam scores</p>
      </div>

      {/* Selection Toolbar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 outline-none">
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Term</label>
          <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 outline-none">
            {terms.map(t => <option key={t.id} value={t.id}>{t.name} ({t.academicYear?.name})</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Subject</label>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 outline-none">
            {subjects
              .filter(s => s.subjectAssignments?.some((sa:any) => sa.classId === selectedClass))
              .filter(s => {
                const isClassTeacher = classes.find(c => c.id === selectedClass)?.classTeacherId === userId;
                if (isClassTeacher) return true;
                
                if (s.teacherAssignments) {
                  return s.teacherAssignments.some((ta:any) => ta.classId === selectedClass);
                }
                return true; // fallback for admin
              })
              .map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
            ))}
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
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <div className="flex gap-4 text-sm font-medium">
                <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {marks.filter(m => m.status === 'COMPLETED').length} Completed
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {marks.filter(m => m.status !== 'COMPLETED').length} Missing
                </span>
              </div>
              <button 
                onClick={handleSaveMarks} 
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Marks'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 w-48">Student Name</th>
                    <th className="text-center">Test 1<br/><span className="text-xs font-normal text-gray-400">(25)</span></th>
                    <th className="text-center">Assign 1<br/><span className="text-xs font-normal text-gray-400">(25)</span></th>
                    <th className="text-center">Test 2<br/><span className="text-xs font-normal text-gray-400">(25)</span></th>
                    <th className="text-center">Assign 2<br/><span className="text-xs font-normal text-gray-400">(25)</span></th>
                    <th className="text-center bg-blue-50/50 dark:bg-blue-900/10">CA Subtotal<br/><span className="text-xs font-normal text-gray-400">(100)</span></th>
                    <th className="text-center text-blue-600">CA 40%<br/><span className="text-xs font-normal text-blue-400">(40)</span></th>
                    <th className="text-center border-l border-gray-200 dark:border-gray-700">Exam<br/><span className="text-xs font-normal text-gray-400">(100)</span></th>
                    <th className="text-center text-blue-600">Exam 60%<br/><span className="text-xs font-normal text-blue-400">(60)</span></th>
                    <th className="text-center font-bold border-l border-gray-200 dark:border-gray-700">Final Total<br/><span className="text-xs font-normal text-gray-400">(100%)</span></th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((m, idx) => {
                    const subtotal = calculateSubtotal(m);
                    const ca40 = Math.round(subtotal * 0.4 * 100) / 100;
                    const exam60 = Math.round((m.examScore || 0) * 0.6 * 100) / 100;
                    const total = Math.round((ca40 + exam60) * 100) / 100;

                    return (
                      <React.Fragment key={m.studentId}>
                        <tr className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/30 dark:bg-gray-800/30'}>
                          <td className="font-medium sticky left-0 bg-inherit z-10 flex items-center justify-between">
                            <span>{m.studentName}</span>
                            {m.audits && m.audits.length > 0 && (
                              <button 
                                onClick={() => toggleExpand(m.studentId)}
                                className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ms-2"
                                title="View Edit History"
                              >
                                {expandedStudents.includes(m.studentId) ? <ChevronUp className="w-4 h-4" /> : <History className="w-4 h-4" />}
                              </button>
                            )}
                          </td>
                          <td className="p-1">
                            <input type="number" min="0" max="25" step="0.1" value={m.test1 || ''} onChange={(e) => handleMarkChange(m.studentId, 'test1', e.target.value)} className="w-full text-center p-2 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white dark:focus:bg-gray-800 outline-none transition-all" />
                          </td>
                          <td className="p-1">
                            <input type="number" min="0" max="25" step="0.1" value={m.assignment1 || ''} onChange={(e) => handleMarkChange(m.studentId, 'assignment1', e.target.value)} className="w-full text-center p-2 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white dark:focus:bg-gray-800 outline-none transition-all" />
                          </td>
                          <td className="p-1">
                            <input type="number" min="0" max="25" step="0.1" value={m.test2 || ''} onChange={(e) => handleMarkChange(m.studentId, 'test2', e.target.value)} className="w-full text-center p-2 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white dark:focus:bg-gray-800 outline-none transition-all" />
                          </td>
                          <td className="p-1">
                            <input type="number" min="0" max="25" step="0.1" value={m.assignment2 || ''} onChange={(e) => handleMarkChange(m.studentId, 'assignment2', e.target.value)} className="w-full text-center p-2 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white dark:focus:bg-gray-800 outline-none transition-all" />
                          </td>
                          <td className="text-center font-medium text-gray-600 dark:text-gray-400 bg-blue-50/50 dark:bg-blue-900/10">{subtotal}</td>
                          <td className="text-center font-bold text-blue-600 dark:text-blue-400">{ca40}</td>
                          <td className="p-1 border-l border-gray-200 dark:border-gray-700">
                            <input type="number" min="0" max="100" step="0.1" value={m.examScore || ''} onChange={(e) => handleMarkChange(m.studentId, 'examScore', e.target.value)} className="w-full text-center p-2 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white dark:focus:bg-gray-800 outline-none transition-all font-semibold" />
                          </td>
                          <td className="text-center font-bold text-blue-600 dark:text-blue-400">{exam60}</td>
                          <td className="text-center font-black text-gray-900 dark:text-white border-l border-gray-200 dark:border-gray-700">{total}</td>
                        </tr>
                        {expandedStudents.includes(m.studentId) && (
                          <tr className="bg-gray-50 dark:bg-gray-800/80 border-y border-gray-200 dark:border-gray-700 shadow-inner">
                            <td colSpan={10} className="p-4">
                              <div className="flex flex-col gap-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                  <History className="w-3 h-3"/> Audit Trail for {m.studentName}
                                </h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                  {m.audits?.map((audit: any) => (
                                    <div key={audit.id} className="flex flex-wrap items-center gap-2 text-xs bg-white dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm">
                                      <span className="text-gray-400 w-32 shrink-0">{new Date(audit.createdAt).toLocaleString()}</span>
                                      <span className="font-semibold text-gray-700 dark:text-gray-300 w-32 truncate" title={audit.modifiedBy?.name}>{audit.modifiedBy?.name || 'User'}</span>
                                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium border border-blue-100 dark:border-blue-800">Field: {audit.field}</span>
                                      
                                      <div className="flex items-center gap-1.5 ms-2">
                                        {audit.oldValue !== null && (
                                          <span className="text-red-500 line-through font-medium">{audit.oldValue}</span>
                                        )}
                                        {audit.oldValue !== null && <span className="text-gray-300">→</span>}
                                        <span className="text-green-600 font-bold">{audit.newValue}</span>
                                      </div>
                                      
                                      {audit.reason && <span className="text-gray-400 italic ms-auto">"{audit.reason}"</span>}
                                    </div>
                                  ))}
                                  {(!m.audits || m.audits.length === 0) && <div className="text-gray-400 italic text-xs py-2">No edit history recorded yet.</div>}
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
