'use client';

import { useState } from 'react';
import { Users, Search, Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [classId, setClassId] = useState('');

  // Queries
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students', search, filterClass],
    queryFn: async () => {
      let url = '/api/students?';
      if (search) url += `search=${search}&`;
      if (filterClass) url += `classId=${filterClass}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch students');
      return res.json();
    }
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await fetch('/api/classes');
      if (!res.ok) throw new Error('Failed to fetch classes');
      return res.json();
    }
  });

  // Mutations
  const studentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const url = editingId ? `/api/students/${editingId}` : '/api/students';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Operation failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success(`Student ${editingId ? 'updated' : 'added'} successfully`);
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete student');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete student');
    }
  });

  const openAddModal = () => {
    setEditingId(null);
    setFirstName('');
    setLastName('');
    setMiddleName('');
    setGender('Male');
    setDateOfBirth('');
    setClassId(classes[0]?.id || '');
    setIsModalOpen(true);
  };

  const openEditModal = (student: any) => {
    setEditingId(student.id);
    setFirstName(student.firstName);
    setLastName(student.lastName);
    setMiddleName(student.middleName);
    setGender(student.gender);
    setDateOfBirth(student.dateOfBirth);
    setClassId(student.classId);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !classId) {
      toast.error('Please fill required fields');
      return;
    }
    studentMutation.mutate({ firstName, lastName, middleName, gender, dateOfBirth, classId });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This will delete all their marks.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in mb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Students Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage all students in the school</p>
        </div>
        <Button onClick={openAddModal} variant="premium" className="shadow-lg">
          <Plus className="w-4 h-4" /> Add Student
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 premium-card p-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="sm:w-64">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-900/10 transition-all text-sm"
          >
            <option value="">All Classes</option>
            {classes.map((cls: any) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="premium-card">
        {isLoadingStudents ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
            <p className="animate-pulse">Loading students records...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">No students found</p>
            <p className="text-sm mt-1">Adjust your filters or add a new student.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Gender</th>
                  <th>Date of Birth</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any, index: number) => (
                  <tr key={student.id}>
                    <td className="w-16 text-slate-400 font-medium">{index + 1}</td>
                    <td className="font-bold text-slate-900 dark:text-white">
                      {student.lastName}, {student.firstName} {student.middleName}
                    </td>
                    <td>
                      <Badge variant="success">
                        {student.class.name}
                      </Badge>
                    </td>
                    <td>{student.gender}</td>
                    <td className="text-slate-500 dark:text-slate-400">{student.dateOfBirth || 'N/A'}</td>
                    <td className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(student)} title="Edit">
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)} title="Delete">
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Student' : 'Add New Student'}>
        <form onSubmit={handleSubmit} className="space-y-6 p-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">First Name *</label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Kwame" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Last Name *</label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Asante" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Middle Name</label>
              <Input value={middleName} onChange={e => setMiddleName(e.target.value)} placeholder="(Optional)" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Class *</label>
              <select value={classId} onChange={e => setClassId(e.target.value)} required className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-slate-900/10 transition-all text-sm">
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-slate-900/10 transition-all text-sm">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Date of Birth</label>
              <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
            </div>
          </div>
          
          <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="premium" disabled={studentMutation.isPending}>
              {studentMutation.isPending ? 'Processing...' : editingId ? 'Save Changes' : 'Add Student'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
