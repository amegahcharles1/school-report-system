'use client';

import { useState } from 'react';
import { School, Plus, Trash2, Edit, User as UserIcon, ShieldCheck, Loader2, Users, BookOpen } from 'lucide-react';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

export default function ClassesPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [classTeacherId, setClassTeacherId] = useState('');

  // Queries
  const { data: classes = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await fetch('/api/classes');
      if (!res.ok) throw new Error('Failed to fetch classes');
      return res.json();
    },
    enabled: isAdmin
  });

  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await fetch('/api/staff');
      if (!res.ok) throw new Error('Failed to fetch staff');
      return res.json();
    },
    enabled: isAdmin
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const url = editingId ? `/api/classes/${editingId}` : '/api/classes';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Operation failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success(`Class ${editingId ? 'updated' : 'added'}`);
      setIsModalOpen(false);
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class deleted');
    },
    onError: () => toast.error('Delete failed')
  });

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setClassTeacherId('');
    setIsModalOpen(true);
  };

  const openEditModal = (cls: any) => {
    setEditingId(cls.id);
    setName(cls.name);
    setClassTeacherId(cls.classTeacherId || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return toast.error('Class name required');
    saveMutation.mutate({ name, classTeacherId: classTeacherId || null });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete ${name}? This removes all students and marks inside it.`)) {
      deleteMutation.mutate(id);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[70vh] bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 m-8 animate-fade-in">
        <div className="h-20 w-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-sm mb-6">
          <ShieldCheck className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Access Restricted</h2>
        <p className="text-slate-500 max-w-sm mt-3 font-medium">Class architecture management is reserved for administrative personnel only.</p>
        <Button variant="outline" className="mt-8" onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  const loading = isLoadingClasses || isLoadingTeachers;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <School className="w-8 h-8 text-emerald-600" /> Departments
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage grade levels and departmental leadership</p>
        </div>
        <Button 
          onClick={openAddModal} 
          variant="premium"
          icon={<Plus className="w-4 h-4" />}
          className="shadow-emerald-500/10"
        >
          Create New Class
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-64 premium-card animate-pulse bg-slate-50 dark:bg-slate-800/50" />)
        ) : classes.length === 0 ? (
          <div className="col-span-full p-24 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
            <School className="w-16 h-16 text-slate-200 mb-6" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No educational departments</h3>
            <p className="text-slate-400 text-sm mb-8">Establish your first class to begin student enrollment.</p>
            <Button onClick={openAddModal} variant="outline">Initialize First Class</Button>
          </div>
        ) : (
          classes.map((cls: any) => (
            <div key={cls.id} className="premium-card p-6 flex flex-col group hover:border-emerald-500/30 transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors uppercase tracking-tighter leading-none">{cls.name}</h3>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant={cls.classTeacher ? 'success' : 'outline'} className="text-[9px] py-0 px-2 h-5">
                      {cls.classTeacher ? `Lead: ${cls.classTeacher.name}` : 'No Leadership'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button onClick={() => openEditModal(cls)} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => handleDelete(cls.id, cls.name)} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Roster</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{cls._count.students} Students</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Courses</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{cls._count.subjectAssignments} Subjects</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Modify Institutional Context" : "Establish Educational Entity"} 
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Class Nomenclature"
            value={name}
            onChange={e => setName(e.target.value)}
            required 
            placeholder="e.g. JHS 1 - EXCELLENCE" 
          />

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Principal Instructor</label>
            <select 
              value={classTeacherId} 
              onChange={e => setClassTeacherId(e.target.value)} 
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none transition-all font-bold text-sm appearance-none"
            >
              <option value="">-- No Leadership Assigned --</option>
              {teachers.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-2 italic font-medium">The assigned leadership will be authorized to validate report cards for this department.</p>
          </div>

          <div className="pt-6 flex gap-3 border-t dark:border-slate-800">
            <Button type="button" onClick={() => setIsModalOpen(false)} variant="outline" className="flex-1">Discard</Button>
            <Button 
              type="submit" 
              variant="premium" 
              className="flex-1 shadow-emerald-500/10"
              isLoading={saveMutation.isPending}
            >
              Confirm Entity
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
