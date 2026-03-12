'use client';

import { useState, useEffect } from 'react';
import { Shield, UserPlus, Trash2, Edit, Save, X, BookOpen, School, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Teacher Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Array of selections
  const [assignments, setAssignments] = useState<{classId: string, subjectId: string}[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, clsRes, subRes] = await Promise.all([
        fetch('/api/staff'),
        fetch('/api/classes'),
        fetch('/api/subjects')
      ]);
      
      const stData = await staffRes.json();
      const clsData = await clsRes.json();
      const subData = await subRes.json();
      
      if (staffRes.ok) setStaff(stData);
      if (clsRes.ok) setClasses(clsData);
      if (subRes.ok) setSubjects(subData);
    } catch (e) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addAssignmentRow = () => {
    if (classes.length > 0 && subjects.length > 0) {
      setAssignments([...assignments, { classId: classes[0].id, subjectId: subjects[0].id }]);
    }
  };

  const removeAssignmentRow = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleAssignmentChange = (index: number, field: 'classId'|'subjectId', value: string) => {
    const updated = [...assignments];
    updated[index][field] = value;
    setAssignments(updated);
  };

  const handleSaveTeacher = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, assignments })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Teacher account created securely! Temporary Password: Welcome123', { duration: 5000 });
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create teacher');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to completely remove ${name} from the system?`)) {
      try {
        const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        toast.success('Teacher removed from system');
        setStaff(staff.filter(s => s.id !== id));
      } catch (e) {
        toast.error('Failed to delete teacher');
      }
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setAssignments([]);
  };

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg mb-2"></div>
        <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800/50 rounded-lg mb-8"></div>
        <div className="h-64 bg-white dark:bg-gray-900 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" /> Staff Management
          </h1>
          <p className="text-gray-500 mt-1">Admin control panel: Securely provision, assign, and manage teacher access.</p>
        </div>
        <button 
          onClick={openModal} 
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium shadow-sm"
        >
          <UserPlus className="w-5 h-5" /> Add Teacher
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl flex items-start gap-4 shadow-sm">
        <AlertCircle className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300">Security Notice</h3>
          <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
            <strong>Do not share verification links.</strong> When you create an account here, the system automatically binds the specific class and subject restrictions selected. The default teacher password is <code>Welcome123</code>. Instruct them to log in and change it.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-1/4">Name</th>
                <th className="w-1/4">Email (Login)</th>
                <th className="w-1/3">Subject Assignments</th>
                <th className="text-right w-1/6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((teacher) => (
                <tr key={teacher.id}>
                  <td className="font-semibold text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs uppercase dark:bg-emerald-900/50 dark:text-emerald-400">
                        {teacher.name.charAt(0)}
                      </div>
                      {teacher.name}
                    </div>
                  </td>
                  <td className="text-gray-500 font-mono text-sm">{teacher.email}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {teacher.teacherAssignments?.map((ta: any) => (
                        <span key={ta.id} className="text-xs px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-medium whitespace-nowrap">
                          {ta.subject?.name} <span className="text-gray-400 mx-1">in</span> {ta.class?.name}
                        </span>
                      ))}
                      {!teacher.teacherAssignments || teacher.teacherAssignments.length === 0 ? (
                        <span className="text-xs px-2 py-1 text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded">No assignments (Read Only)</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleDeleteTeacher(teacher.id, teacher.name)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete Account">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 italic">No teacher accounts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" /> Provision Teacher Account
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-emerald-500" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email Address (Login)</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-emerald-500" placeholder="e.g. john@school.com" />
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200"><BookOpen className="w-4 h-4 text-emerald-600"/> Subject Access Bindings</h3>
                  <button onClick={addAssignmentRow} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md dark:bg-emerald-900/30">
                    + Add New Binding
                  </button>
                </div>
                
                {assignments.length > 0 ? (
                  <div className="space-y-3">
                    {assignments.map((assignment, idx) => (
                      <div key={idx} className="flex gap-3 items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <select 
                          value={assignment.classId} 
                          onChange={e => handleAssignmentChange(idx, 'classId', e.target.value)} 
                          className="flex-1 py-1.5 px-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm outline-none"
                        >
                          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select 
                          value={assignment.subjectId} 
                          onChange={e => handleAssignmentChange(idx, 'subjectId', e.target.value)} 
                          className="flex-1 py-1.5 px-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm outline-none"
                        >
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <button onClick={() => removeAssignmentRow(idx)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-center">
                    This teacher has no classes assigned yet. They will only have Read-Only view across the dashboard until bound to a subject and class.
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-800/20">
              <button disabled={saving} onClick={() => setIsModalOpen(false)} className="px-5 py-2 font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button disabled={saving} onClick={handleSaveTeacher} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'Provisioning...' : 'Provision Teacher Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
