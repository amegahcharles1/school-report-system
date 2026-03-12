'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Shield, UserPlus, Trash2, Edit, Save, X,
  BookOpen, AlertCircle, KeyRound, RefreshCw,
  CheckCircle, Mail, User, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [staff, setStaff] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [assignments, setAssignments] = useState<{ classId: string; subjectId: string }[]>([]);

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editAssignments, setEditAssignments] = useState<{ classId: string; subjectId: string }[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, clsRes, subRes] = await Promise.all([
        fetch('/api/staff'),
        fetch('/api/classes'),
        fetch('/api/subjects'),
      ]);
      if (staffRes.ok) setStaff(await staffRes.json());
      if (clsRes.ok) setClasses(await clsRes.json());
      if (subRes.ok) setSubjects(await subRes.json());
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ─── ADD TEACHER ───
  const handleAddTeacher = async () => {
    if (!name.trim() || !email.trim()) { toast.error('Name and email are required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, assignments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('✅ Teacher account created! Default password: Welcome123', { duration: 6000 });
      setIsAddOpen(false);
      setName(''); setEmail(''); setAssignments([]);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create teacher');
    } finally {
      setSaving(false);
    }
  };

  // ─── OPEN EDIT MODAL ───
  const openEdit = (teacher: any) => {
    setEditingTeacher(teacher);
    setEditName(teacher.name);
    setEditEmail(teacher.email);
    setEditPassword('');
    setEditAssignments(
      teacher.teacherAssignments?.map((ta: any) => ({
        classId: ta.classId || ta.class?.id || '',
        subjectId: ta.subjectId || ta.subject?.id || '',
      })) || []
    );
    setIsEditOpen(true);
  };

  // ─── SAVE EDIT ───
  const handleSaveEdit = async () => {
    if (!editName.trim() || !editEmail.trim()) { toast.error('Name and email are required'); return; }
    if (editPassword && editPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/staff/${editingTeacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          newPassword: editPassword || undefined,
          assignments: editAssignments,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('✅ Teacher account updated successfully!');
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update teacher');
    } finally {
      setSaving(false);
    }
  };

  // ─── RESET PASSWORD (Quick action) ───
  const handleResetPassword = async (teacher: any) => {
    if (!confirm(`Reset ${teacher.name}'s password to "Welcome123"?`)) return;
    try {
      const res = await fetch(`/api/staff/${teacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teacher.name, email: teacher.email, newPassword: 'Welcome123', assignments: teacher.teacherAssignments?.map((ta: any) => ({ classId: ta.classId, subjectId: ta.subjectId })) }),
      });
      if (res.ok) { toast.success(`✅ Password reset to "Welcome123" for ${teacher.name}`); }
      else toast.error('Failed to reset password');
    } catch { toast.error('Network error'); }
  };

  // ─── DELETE ───
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the system? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Teacher removed'); setStaff(staff.filter(s => s.id !== id)); }
      else toast.error('Failed to delete');
    } catch { toast.error('Network error'); }
  };

  // ─── ASSIGNMENT HELPERS ───
  const addRow = (arr: any[], setArr: any) => {
    if (classes.length > 0 && subjects.length > 0) {
      setArr([...arr, { classId: classes[0].id, subjectId: subjects[0].id }]);
    }
  };
  const removeRow = (arr: any[], setArr: any, idx: number) => setArr(arr.filter((_: any, i: number) => i !== idx));
  const changeRow = (arr: any[], setArr: any, idx: number, field: string, value: string) => {
    const updated = [...arr]; updated[idx][field] = value; setArr(updated);
  };

  if (role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <Shield className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-500">Admin Access Only</h2>
        <p className="text-gray-400 text-sm">This section is restricted to administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" /> Teacher Account Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Admin control panel — edit accounts, reset passwords, and reassign subjects
          </p>
        </div>
        <button
          onClick={() => { setName(''); setEmail(''); setAssignments([]); setIsAddOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-medium shadow-sm whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Security Notice</p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
            Default password for new teachers is <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Welcome123</code>. 
            You can reset any teacher's password at any time. All changes take effect immediately.
          </p>
        </div>
      </div>

      {/* Teacher Cards */}
      {loading ? (
        <div className="grid gap-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No teacher accounts yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {staff.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Avatar + Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{teacher.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono truncate">{teacher.email}</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleResetPassword(teacher)}
                    title="Reset Password to Welcome123"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reset Password
                  </button>
                  <button
                    onClick={() => openEdit(teacher)}
                    title="Edit Account"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(teacher.id, teacher.name)}
                    title="Delete Account"
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Assignments */}
              <div className="mt-4 flex flex-wrap gap-2">
                {teacher.teacherAssignments?.length > 0 ? (
                  teacher.teacherAssignments.map((ta: any) => (
                    <span
                      key={ta.id}
                      className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium"
                    >
                      {ta.subject?.name} <span className="text-emerald-400 mx-1">·</span> {ta.class?.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 italic">
                    No subject assignments
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── ADD TEACHER MODAL ─── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" /> Add New Teacher
              </h2>
              <button onClick={() => setIsAddOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Full Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mr. Charles" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-emerald-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email (Login)</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. charles@school.com" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-emerald-500 text-sm" />
                </div>
              </div>
              <AssignmentBuilder arr={assignments} setArr={setAssignments} classes={classes} subjects={subjects} addRow={addRow} removeRow={removeRow} changeRow={changeRow} />
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
              <button onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200">Cancel</button>
              <button disabled={saving} onClick={handleAddTeacher} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT TEACHER MODAL ─── */}
      {isEditOpen && editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" /> Edit — {editingTeacher.name}
              </h2>
              <button onClick={() => setIsEditOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {/* Account Details */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Account Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Full Name</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Email (Login)</label>
                    <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-sm" />
                  </div>
                </div>
              </div>

              {/* Password Reset */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" /> Change Password
                </h3>
                <input
                  type="password"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg outline-none focus:border-amber-500 text-sm"
                />
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Minimum 6 characters. Leave blank to keep the existing password.</p>
              </div>

              {/* Subject Assignments */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" /> Subject & Class Assignments
                </h3>
                <AssignmentBuilder arr={editAssignments} setArr={setEditAssignments} classes={classes} subjects={subjects} addRow={addRow} removeRow={removeRow} changeRow={changeRow} />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
              <button onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200">Cancel</button>
              <button disabled={saving} onClick={handleSaveEdit} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
                <CheckCircle className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable assignment builder component
function AssignmentBuilder({ arr, setArr, classes, subjects, addRow, removeRow, changeRow }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> Subject Bindings
        </h3>
        <button
          onClick={() => addRow(arr, setArr)}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg"
        >
          + Add Row
        </button>
      </div>
      {arr.length === 0 ? (
        <p className="text-sm text-gray-400 italic text-center py-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          No assignments. Click "+ Add Row" to assign subjects and classes.
        </p>
      ) : (
        <div className="space-y-2">
          {arr.map((a: any, idx: number) => (
            <div key={idx} className="flex gap-2 items-center bg-gray-50 dark:bg-gray-800 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <select
                value={a.classId}
                onChange={e => changeRow(arr, setArr, idx, 'classId', e.target.value)}
                className="flex-1 py-1.5 px-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm outline-none"
              >
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select
                value={a.subjectId}
                onChange={e => changeRow(arr, setArr, idx, 'subjectId', e.target.value)}
                className="flex-1 py-1.5 px-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm outline-none"
              >
                {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button onClick={() => removeRow(arr, setArr, idx)} className="p-1 text-red-400 hover:text-red-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
