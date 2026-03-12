'use client';

import { useState, useEffect } from 'react';
import { School, Plus, Trash2, Edit, User as UserIcon, ShieldCheck } from 'lucide-react';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

export default function ClassesPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [classTeacherId, setClassTeacherId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clsRes, teacherRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/staff')
      ]);
      
      if (clsRes.ok) setClasses(await clsRes.json());
      if (teacherRes.ok) setTeachers(await teacherRes.json());
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return toast.error('Class name required');

    const url = editingId ? `/api/classes/${editingId}` : '/api/classes';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          classTeacherId: classTeacherId || null 
        }),
      });

      if (res.ok) {
        toast.success(`Class ${editingId ? 'updated' : 'added'}`);
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Operation failed');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete ${name}? This removes all students and marks inside it.`)) {
      try {
        const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Class deleted');
          fetchData();
        } else {
          toast.error('Delete failed');
        }
      } catch {
        toast.error('Network error');
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[70vh]">
        <ShieldCheck className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Access Only</h2>
        <p className="text-gray-500 mt-2">Class management is restricted to administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <School className="w-6 h-6 text-emerald-600" /> Academic Classes
          </h1>
          <p className="text-gray-500 mt-1">Manage grade levels and assign responsible class teachers</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg transition-all font-medium">
          <Plus className="w-4 h-4" /> Create New Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-44 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)
        ) : classes.length === 0 ? (
          <div className="col-span-full p-20 text-center text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
            <School className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold">No academic classes found</p>
            <p className="text-sm">Click "Create New Class" to get started.</p>
          </div>
        ) : (
          classes.map((cls) => (
            <div key={cls.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex flex-col group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors uppercase">{cls.name}</h3>
                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <UserIcon className="w-3 h-3" /> 
                    {cls.classTeacher?.name ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Tr. {cls.classTeacher.name}</span>
                    ) : (
                      <span className="italic text-amber-500 font-medium">Unassigned</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(cls)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(cls.id, cls.name)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="mt-auto grid grid-cols-2 gap-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase">Students</p>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200">{cls._count.students}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase">Subjects</p>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200">{cls._count.subjectAssignments}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Modify Class Context" : "Establish New Class"} size="sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Detailed Class Name</label>
            <input 
              type="text" value={name} onChange={e => setName(e.target.value)} required 
              placeholder="e.g. JHS 1 - EXCELLENCE" 
              className="w-full px-4 py-2 border rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none transition-all font-medium" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Form / Class Teacher Assignment</label>
            <select 
              value={classTeacherId} 
              onChange={e => setClassTeacherId(e.target.value)} 
              className="w-full px-4 py-2 border rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none transition-all font-medium"
            >
              <option value="">-- No Teacher Assigned --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-2 italic font-medium">Selected teacher will appear on report cards for this specific class.</p>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t dark:border-gray-800">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors uppercase">Dismiss</button>
            <button type="submit" className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 text-sm font-black uppercase tracking-wider transition-all transform active:scale-95">
              Confirm Configuration
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
