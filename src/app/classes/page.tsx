'use client';

import { useState, useEffect } from 'react';
import { School, Plus, Trash2, Edit } from 'lucide-react';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/classes');
      if (res.ok) setClasses(await res.json());
    } catch (error) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setIsModalOpen(true);
  };

  const openEditModal = (cls: any) => {
    setEditingId(cls.id);
    setName(cls.name);
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
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        toast.success(`Class ${editingId ? 'updated' : 'added'}`);
        setIsModalOpen(false);
        fetchClasses();
      } else {
        toast.error('Operation failed');
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
          fetchClasses();
        } else {
          toast.error('Delete failed');
        }
      } catch {
        toast.error('Network error');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <School className="w-6 h-6 text-green-600" /> Classes
          </h1>
          <p className="text-gray-500 mt-1">Manage school grades, form classes or sections</p>
        </div>
        <button onClick={openAddModal} className="flex gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm">
          <Plus className="w-4 h-4" /> Add Class
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center text-gray-500">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="col-span-full p-12 text-center text-gray-500">No classes found. Add JHS 1, JHS 2, etc.</div>
        ) : (
          classes.map((cls) => (
            <div key={cls.id} className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm card-hover flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{cls.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(cls)} className="p-1 text-gray-400 hover:text-green-600"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(cls.id, cls.name)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between text-sm">
                <span className="text-gray-500"><b className="text-gray-900 dark:text-white">{cls._count.students}</b> Students</span>
                <span className="text-gray-500"><b className="text-gray-900 dark:text-white">{cls._count.subjectAssignments}</b> Subjects</span>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Class Config" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Class Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. JHS 1" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700" />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t dark:border-gray-800">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 text-sm font-medium">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm text-sm font-medium">Save Class</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
