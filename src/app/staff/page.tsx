'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Shield, UserPlus, Trash2, Edit, Save, X,
  BookOpen, AlertCircle, RefreshCw,
  CheckCircle, Mail, User, Lock, Loader2, ShieldCheck, ChevronRight, PowerOff, UserMinus, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/Modal';

export default function StaffPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const queryClient = useQueryClient();

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
  const [editIsActive, setEditIsActive] = useState(true);
  const [editAssignments, setEditAssignments] = useState<{ classId: string; subjectId: string }[]>([]);

  // Queries
  const { data: staff = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await fetch('/api/staff');
      if (!res.ok) throw new Error('Failed to fetch staff');
      return res.json();
    },
    enabled: role === 'ADMIN'
  });

  const { data: classes = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await fetch('/api/classes');
      if (!res.ok) throw new Error('Failed to fetch classes');
      return res.json();
    },
    enabled: role === 'ADMIN'
  });

  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await fetch('/api/subjects');
      if (!res.ok) throw new Error('Failed to fetch subjects');
      return res.json();
    },
    enabled: role === 'ADMIN'
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const isEditing = !!editingTeacher;
      const url = isEditing ? `/api/staff/${editingTeacher.id}` : '/api/staff';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      if (!editingTeacher) {
        toast.success('✅ Teacher account created! Default password: Welcome123', { duration: 6000 });
        setIsAddOpen(false);
        setName(''); setEmail(''); setAssignments([]);
      } else {
        toast.success('✅ Teacher account updated successfully!');
        setIsEditOpen(false);
      }
    },
    onError: (err: Error) => toast.error(err.message || 'Operation failed')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Teacher removed');
    },
    onError: () => toast.error('Delete failed')
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (teacher: any) => {
      const res = await fetch(`/api/staff/${teacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: teacher.name, 
          email: teacher.email, 
          newPassword: 'Welcome123', 
          assignments: teacher.teacherAssignments?.map((ta: any) => ({ 
            classId: ta.classId, 
            subjectId: ta.subjectId 
          })) 
        }),
      });
      if (!res.ok) throw new Error('Failed to reset password');
      return res.json();
    },
    onSuccess: (_, teacher) => {
      toast.success(`✅ Password reset to "Welcome123" for ${teacher.name}`);
    },
    onError: () => toast.error('Failed to reset password')
  });

  // ─── ADD TEACHER ───
  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { toast.error('Name and email are required'); return; }
    saveMutation.mutate({ name, email, assignments });
  };

  // ─── OPEN EDIT MODAL ───
  const openEdit = (teacher: any) => {
    setEditingTeacher(teacher);
    setEditName(teacher.name);
    setEditEmail(teacher.email);
    setEditIsActive(teacher.isActive !== false);
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
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) { toast.error('Name and email are required'); return; }
    if (editPassword && editPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    saveMutation.mutate({
      name: editName,
      email: editEmail,
      isActive: editIsActive,
      newPassword: editPassword || undefined,
      assignments: editAssignments,
    });
  };

  // ─── DELETE ───
  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the system? This cannot be undone.`)) return;
    deleteMutation.mutate(id);
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
      <div className="flex flex-col items-center justify-center p-12 text-center h-[70vh] bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 m-8 animate-fade-in">
        <div className="h-20 w-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-sm mb-6">
          <ShieldCheck className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Access Restricted</h2>
        <p className="text-slate-500 max-w-sm mt-3 font-medium">Teacher account administration is reserved for school leadership only.</p>
        <Button variant="outline" className="mt-8" onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  const loading = isLoadingStaff || isLoadingClasses || isLoadingSubjects;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-600" /> Faculty Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Authorize instructors and configure their academic jurisdictions
          </p>
        </div>
        <Button
          onClick={() => { setName(''); setEmail(''); setAssignments([]); setIsAddOpen(true); }}
          variant="premium"
          icon={<UserPlus className="w-4 h-4" />}
          className="shadow-emerald-500/10"
        >
          Add New Instructor
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-6 rounded-3xl flex items-start gap-4">
        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-800 rounded-2xl flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest">Security Protocol</p>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-2 font-medium">
            Initialization key for new instructors is <code className="bg-blue-100/50 dark:bg-blue-800/50 px-2 py-0.5 rounded-lg font-black tracking-tighter">Welcome123</code>. 
            All modifications to departmental reach or credentials propagate in real-time.
          </p>
        </div>
      </div>

      {/* Teacher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-32 premium-card animate-pulse" />)
        ) : staff.length === 0 ? (
          <div className="col-span-full py-24 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
            <Shield className="w-16 h-16 text-slate-200 mb-6" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No active faculty</h3>
            <p className="text-slate-400 text-sm mb-8">Start by establishing your first teacher account.</p>
            <Button onClick={() => setIsAddOpen(true)} variant="outline">Create Instructor Account</Button>
          </div>
        ) : (
          staff.map((teacher: any) => (
            <div
              key={teacher.id}
              className="premium-card p-6 flex flex-col lg:flex-row lg:items-center gap-6 group hover:border-emerald-500/20 transition-all duration-300"
            >
              {/* Profile Section */}
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-500/20 shrink-0 group-hover:scale-110 transition-transform">
                  {teacher.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white truncate">{teacher.name}</h3>
                    {teacher.isActive === false && (
                      <Badge variant="danger" className="bg-rose-100 text-rose-700 border-rose-200">Suspended</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold truncate tracking-tight">{teacher.email}</p>
                  </div>
                </div>
              </div>

              {/* Jurisdictions */}
              <div className="flex flex-wrap gap-2 flex-[2]">
                {teacher.teacherAssignments?.length > 0 ? (
                  teacher.teacherAssignments.map((ta: any) => (
                    <Badge
                      key={ta.id}
                      variant="outline"
                      className="text-[10px] bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800 py-1"
                    >
                      <span className="font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter mr-1.5">{ta.subject?.name}</span>
                      <ChevronRight className="w-2 h-2 text-slate-300 mr-1.5" />
                      <span className="font-bold text-slate-500">{ta.class?.name}</span>
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="text-[10px] italic text-slate-400 border-dashed">
                    No departmental duties assigned
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-50 dark:border-slate-800 opacity-60 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={() => resetPasswordMutation.mutate(teacher)}
                  variant="outline"
                  size="sm"
                  isLoading={resetPasswordMutation.isPending && resetPasswordMutation.variables?.id === teacher.id}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="text-[10px] font-black uppercase tracking-widest h-9"
                >
                  Reset
                </Button>
                <Button
                  onClick={() => openEdit(teacher)}
                  variant="outline"
                  size="sm"
                  icon={<Edit className="w-3.5 h-3.5" />}
                  className="text-[10px] font-black uppercase tracking-widest h-9 border-blue-100 text-blue-600 hover:bg-blue-50"
                >
                  Configure
                </Button>
                
                <Button
                  onClick={() => {
                    if (confirm(`Are you sure you want to ${teacher.isActive === false ? 'reactivate' : 'suspend'} this account?`)) {
                       saveMutation.mutate({ ...teacher, isActive: teacher.isActive === false });
                    }
                  }}
                  variant="outline"
                  size="sm"
                  icon={teacher.isActive === false ? <UserCheck className="w-3.5 h-3.5" /> : <UserMinus className="w-3.5 h-3.5" />}
                  className={`text-[10px] font-black uppercase tracking-widest h-9 ${teacher.isActive === false ? 'border-emerald-100 text-emerald-600 hover:bg-emerald-50' : 'border-amber-100 text-amber-600 hover:bg-amber-50'}`}
                >
                  {teacher.isActive === false ? 'Activate' : 'Suspend'}
                </Button>

                <Button
                  onClick={() => handleDelete(teacher.id, teacher.name)}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                  title="Permanent Deletion"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── ADD TEACHER MODAL ─── */}
      <Modal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        title="Establish Faculty Account"
        size="lg"
      >
        <form onSubmit={handleAddTeacher} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Legal Full Name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Professor X" 
              required
            />
            <Input 
              label="Institutional Email" 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="e.g. x@school.com" 
              required
            />
          </div>
          
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Curricular Assignments</h4>
            <AssignmentBuilder 
              arr={assignments} 
              setArr={setAssignments} 
              classes={classes} 
              subjects={subjects} 
              addRow={addRow} 
              removeRow={removeRow} 
              changeRow={changeRow} 
            />
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button type="button" onClick={() => setIsAddOpen(false)} variant="outline">Cancel</Button>
            <Button 
              type="submit" 
              variant="premium" 
              icon={<Save className="w-4 h-4" />}
              isLoading={saveMutation.isPending && !editingTeacher}
            >
              Initialize Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── EDIT TEACHER MODAL ─── */}
      <Modal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        title={`Configure Associate — ${editingTeacher?.name || ''}`}
        size="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-8">
          {/* Account Details */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="Full Name" 
                value={editName} 
                onChange={e => setEditName(e.target.value)} 
                required
              />
              <Input 
                label="Login Email" 
                type="email" 
                value={editEmail} 
                onChange={e => setEditEmail(e.target.value)} 
                required
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="text-sm font-bold">Account Access Status</p>
                <p className="text-xs text-slate-500">Enable or disable login access without deleting data</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={editIsActive} onChange={e => setEditIsActive(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Password Reset Section */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Authentication override</h4>
            </div>
            <Input
              type="password"
              value={editPassword}
              onChange={e => setEditPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="new-password"
            />
            <p className="text-[10px] text-slate-400 italic">Leave empty to retain existing cryptographical identity. Minimum 6 characters.</p>
          </div>

          {/* Subject Assignments */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Jurisdictional Coverage</h4>
            <AssignmentBuilder 
              arr={editAssignments} 
              setArr={setEditAssignments} 
              classes={classes} 
              subjects={subjects} 
              addRow={addRow} 
              removeRow={removeRow} 
              changeRow={changeRow} 
            />
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button type="button" onClick={() => setIsEditOpen(false)} variant="outline">Discard</Button>
            <Button 
              type="submit" 
              variant="premium" 
              icon={<CheckCircle className="w-4 h-4" />}
              isLoading={saveMutation.isPending && !!editingTeacher}
            >
              Commit Modifications
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Reusable assignment builder component
function AssignmentBuilder({ arr, setArr, classes, subjects, addRow, removeRow, changeRow }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Active Bindings</p>
        <Button
          type="button"
          onClick={() => addRow(arr, setArr)}
          variant="outline"
          size="sm"
          className="h-8 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-950"
        >
          + Append Domain
        </Button>
      </div>
      
      {arr.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400 italic">No academic domains assigned</p>
        </div>
      ) : (
        <div className="space-y-3">
          {arr.map((a: any, idx: number) => (
            <div key={idx} className="flex gap-3 items-center p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-slide-in">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Academic Level</label>
                <select
                  value={a.classId}
                  onChange={e => changeRow(arr, setArr, idx, 'classId', e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none"
                >
                  {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Subject Matter</label>
                <select
                  value={a.subjectId}
                  onChange={e => changeRow(arr, setArr, idx, 'subjectId', e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none"
                >
                  {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <Button 
                type="button"
                onClick={() => removeRow(arr, setArr, idx)} 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 text-slate-300 hover:text-rose-600 self-end"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
