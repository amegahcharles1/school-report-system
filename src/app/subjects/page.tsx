'use client';

import { useState } from 'react';
import { BookOpen, Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

export default function SubjectsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [isCompulsory, setIsCompulsory] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Queries
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await fetch('/api/subjects');
      if (!res.ok) throw new Error('Failed to fetch subjects');
      return res.json();
    }
  });

  const { data: classes = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await fetch('/api/classes');
      if (!res.ok) throw new Error('Failed to fetch classes');
      return res.json();
    }
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const url = editingId ? `/api/subjects/${editingId}` : '/api/subjects';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Operation failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success(`Subject ${editingId ? 'updated' : 'added'}`);
      setIsModalOpen(false);
    },
    onError: () => toast.error('Operation failed')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Subject deleted');
    },
    onError: () => toast.error('Delete failed')
  });

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setIsCompulsory(true);
    setSelectedClasses(classes.map((c: any) => c.id)); 
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Subject name is required');
      return;
    }
    saveMutation.mutate({ name, isCompulsory, classIds: selectedClasses });
  };

  const handleDelete = (id: string, subjectName: string) => {
    if (confirm(`Delete ${subjectName}? This will remove all associated marks.`)) {
      deleteMutation.mutate(id);
    }
  };

  const loading = isLoadingSubjects || isLoadingClasses;

  return (
    <div className="space-y-8 animate-fade-in mb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-purple-600" /> Curriculum
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Define subjects and assign them to departments</p>
        </div>
        <Button
          onClick={openAddModal}
          variant="premium"
          icon={<Plus className="w-4 h-4" />}
        >
          Add New Subject
        </Button>
      </div>

      <div className="premium-card overflow-hidden">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            <p className="text-slate-400 font-bold">Synchronizing curriculum...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No subjects found</h3>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm">Every educational system needs a curriculum. Start by adding your first subject.</p>
            <Button onClick={openAddModal} variant="outline" size="lg">Define First Subject</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Subject Identity</th>
                  <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Categorization</th>
                  <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Departmental Coverage</th>
                  <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {subjects.map((subject: any, index: number) => (
                  <tr key={subject.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900 dark:text-white">{subject.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={subject.isCompulsory ? 'premium' : 'outline'} className="text-[10px]">
                        {subject.isCompulsory ? 'Compulsory' : 'Optional'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {subject.subjectAssignments?.length > 0 ? (
                          subject.subjectAssignments.map((sa: any) => (
                            <span key={sa.id} className="inline-flex px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                              {sa.class.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-rose-500 font-bold">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={() => openEditModal(subject)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-purple-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(subject.id, subject.name)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? 'Modify Subject' : 'New Curricular Entity'} 
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Subject Nomenclature"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="e.g. Advanced Mathematics"
          />
          
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">Compulsory Requirement</p>
              <p className="text-[11px] text-slate-500">Mandalory for all students in assigned classes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isCompulsory} 
                onChange={e => setIsCompulsory(e.target.checked)} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Departmental Reach</label>
            <div className="grid grid-cols-2 gap-2">
              {classes.map((cls: any) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => handleClassToggle(cls.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-left ${
                    selectedClasses.includes(cls.id)
                      ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 ring-2 ring-purple-500/10'
                      : 'bg-white border-slate-100 dark:bg-slate-950 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className={`text-xs font-bold ${selectedClasses.includes(cls.id) ? 'text-purple-700 dark:text-purple-300' : 'text-slate-600 dark:text-slate-400'}`}>
                    {cls.name}
                  </span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedClasses.includes(cls.id) ? 'bg-purple-600 border-purple-600' : 'border-slate-200'
                  }`}>
                    {selectedClasses.includes(cls.id) && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="pt-6 flex gap-3 border-t border-slate-50 dark:border-slate-800">
            <Button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
              variant="outline"
              className="flex-1"
            >
              Discard
            </Button>
            <Button 
              type="submit" 
              variant="premium"
              className="flex-1"
              isLoading={saveMutation.isPending}
            >
              {editingId ? 'Update Curricuum' : 'Establish Subject'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
