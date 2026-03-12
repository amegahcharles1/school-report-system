'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Edit } from 'lucide-react';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [isCompulsory, setIsCompulsory] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subjRes, clsRes] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/classes')
      ]);
      if (subjRes.ok) setSubjects(await subjRes.json());
      if (clsRes.ok) setClasses(await clsRes.json());
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
    setIsCompulsory(true);
    setSelectedClasses(classes.map(c => c.id)); // Default to all classes
    setIsModalOpen(true);
  };

  const openEditModal = (subject: any) => {
    setEditingId(subject.id);
    setName(subject.name);
    setIsCompulsory(subject.isCompulsory);
    setSelectedClasses(subject.subjectAssignments?.map((sa: any) => sa.classId) || []);
    setIsModalOpen(true);
  };

  const handleClassToggle = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Subject name is required');
      return;
    }

    const payload = { name, isCompulsory, classIds: selectedClasses };
    const url = editingId ? `/api/subjects/${editingId}` : '/api/subjects';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`Subject ${editingId ? 'updated' : 'added'}`);
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error('Operation failed');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleDelete = async (id: string, subjectName: string) => {
    if (confirm(`Delete ${subjectName}? This will remove all associated marks.`)) {
      try {
        const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Subject deleted');
          fetchData();
        } else {
          toast.error('Delete failed');
        }
      } catch (error) {
        toast.error('Network error');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-600" /> Subjects
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage subjects and class assignments</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No subjects found. Add a subject to begin.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Subject Name</th>
                  <th>Type</th>
                  <th>Assigned Classes</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject, index) => (
                  <tr key={subject.id}>
                    <td className="w-16 text-gray-500">{index + 1}</td>
                    <td className="font-medium text-gray-900 dark:text-white">{subject.name}</td>
                    <td>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${subject.isCompulsory ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {subject.isCompulsory ? 'Compulsory' : 'Optional'}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {subject.subjectAssignments?.map((sa: any) => (
                          <span key={sa.id} className="inline-flex px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                            {sa.class.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-right space-x-2">
                      <button onClick={() => openEditModal(subject)} className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded transition-colors inline-block text-sm">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(subject.id, subject.name)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors inline-block text-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Subject' : 'Add Subject'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Mathematics" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isCompulsory} onChange={e => setIsCompulsory(e.target.checked)} className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Compulsory Subject</span>
          </label>

          <div className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign to Classes</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {classes.map(cls => (
                <label key={cls.id} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input type="checkbox" checked={selectedClasses.includes(cls.id)} onChange={() => handleClassToggle(cls.id)} className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500" />
                  <span className="text-sm text-gray-800 dark:text-gray-200">{cls.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm">
              {editingId ? 'Save Options' : 'Add Subject'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
