'use client';

import { useState } from 'react';
import { Users, Search, Plus, Trash2, Edit, Loader2, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'roster' | 'trash'>('roster');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [classId, setClassId] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('Active');

  // Queries
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students', search, filterClass, activeTab],
    queryFn: async () => {
      let url = '/api/students?';
      if (search) url += `search=${search}&`;
      if (filterClass) url += `classId=${filterClass}&`;
      if (activeTab === 'trash') url += `includeDeleted=true`;
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
    mutationFn: async ({ id, permanent }: { id: string; permanent: boolean }) => {
      const res = await fetch(`/api/students/${id}?permanent=${permanent}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete student');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success(variables.permanent ? 'Student permanently erased' : 'Student moved to Recycle Bin');
    },
    onError: () => {
      toast.error('Failed to eliminate record');
    }
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      if (!res.ok) throw new Error('Failed to restore');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student record restored successfully');
    }
  });

  const openAddModal = () => {
    setEditingId(null);
    setFirstName('');
    setLastName('');
    setMiddleName('');
    setGender('Male');
    setDateOfBirth('');
    setAdmissionNumber('');
    setParentName('');
    setParentContact('');
    setAddress('');
    setStatus('Active');
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
    setAdmissionNumber(student.admissionNumber || '');
    setParentName(student.parentName || '');
    setParentContact(student.parentContact || '');
    setAddress(student.address || '');
    setStatus(student.status || 'Active');
    setClassId(student.classId);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !classId) {
      toast.error('Please fill required fields');
      return;
    }
    studentMutation.mutate({ firstName, lastName, middleName, gender, dateOfBirth, classId, admissionNumber, parentName, parentContact, address, status });
  };

  const handleDelete = (id: string, name: string) => {
    if (activeTab === 'trash') {
      if (confirm(`CRITICAL ACTION: Permanently delete ${name}? This action is IRREVERSIBLE and will also erase all their assessment history.`)) {
        deleteMutation.mutate({ id, permanent: true });
      }
    } else {
      if (confirm(`Move ${name} to Recycle Bin? They will be removed from all active rosters but record will be preserved.`)) {
        deleteMutation.mutate({ id, permanent: false });
      }
    }
  };

  const handleRestore = (id: string) => {
     restoreMutation.mutate(id);
  };

  return (
    <div className="space-y-6 animate-fade-in mb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" /> Students Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Access and curate student academic identities</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`px-4 py-1.5 cursor-pointer transition-all ${activeTab === 'roster' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'}`} onClick={() => setActiveTab('roster')}>
            Active Roster
          </Badge>
          <Badge variant="outline" className={`px-4 py-1.5 cursor-pointer transition-all ${activeTab === 'trash' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'}`} onClick={() => setActiveTab('trash')}>
            Recycle Bin
          </Badge>
          <Button onClick={openAddModal} variant="premium" className="shadow-lg shadow-blue-500/10 h-10 ml-2">
            <Plus className="w-4 h-4" /> New Student
          </Button>
        </div>
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

      <div className={`premium-card overflow-hidden border-t-4 ${activeTab === 'trash' ? 'border-rose-600' : 'border-indigo-600'}`}>
        {isLoadingStudents ? (
          <div className="p-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
            <p className="font-bold tracking-widest uppercase text-xs opacity-50">Synchronizing Rosters...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-24 text-center text-slate-500">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
              {activeTab === 'trash' ? <Trash2 className="w-10 h-10 text-rose-300" /> : <Users className="w-10 h-10 text-blue-200" />}
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              {activeTab === 'trash' ? 'Recycle Bin Empty' : 'No Students Captured'}
            </p>
            <p className="text-sm font-medium mt-2 max-w-xs mx-auto text-slate-400">
              {activeTab === 'trash' ? 'Student records moved here will appear for restoration or permanent deletion.' : 'Begin by capturing your student details or adjust your search parameters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50">
                  <th className="font-black text-[10px] uppercase tracking-widest text-slate-400">Tier Index</th>
                  <th className="font-black text-[10px] uppercase tracking-widest text-slate-400">Institutional ID</th>
                  <th className="font-black text-[10px] uppercase tracking-widest text-slate-400">Full Academic Name</th>
                  <th className="font-black text-[10px] uppercase tracking-widest text-slate-400">Assigned Level</th>
                  <th className="font-black text-[10px] uppercase tracking-widest text-slate-400">Guardian Intel</th>
                  <th className="font-black text-[10px] uppercase tracking-widest text-slate-400">Lifecycle Status</th>
                  <th className="text-right font-black text-[10px] uppercase tracking-widest text-slate-400 px-6">Direct Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Array.isArray(students) && students.map((student: any, index: number) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all group">
                    <td className="w-16 font-bold text-slate-300 text-xs italic">#{index + 1}</td>
                    <td className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded inline-block mt-4 ml-4">
                      {student.admissionNumber || 'PENDING-ID'}
                    </td>
                    <td className="py-4">
                      <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{student.lastName}, {student.firstName}</p>
                      <p className="text-[10px] font-bold text-slate-400 italic">{student.gender} • DOB: {student.dateOfBirth || 'UNSET'}</p>
                    </td>
                    <td>
                      <Badge variant="outline" className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-black text-[10px]">
                        {student.class.name}
                      </Badge>
                    </td>
                    <td className="text-xs">
                      <p className="font-bold text-slate-700 dark:text-slate-300">{student.parentName || 'DATA MISSING'}</p>
                      <p className="text-slate-400 tracking-tighter">{student.parentContact || 'NO PHONE'}</p>
                    </td>
                    <td>
                      <Badge variant={student.status === 'Active' ? 'success' : 'default'} className="font-black text-[9px] tracking-widest h-5">
                        {student.status || 'Active'}
                      </Badge>
                    </td>
                    <td className="text-right px-6 space-x-1">
                      {activeTab === 'trash' ? (
                        <>
                           <Button variant="ghost" size="icon" onClick={() => handleRestore(student.id)} title="Restore Student" className="hover:bg-emerald-50 text-emerald-600">
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)} title="Erase Permanently" className="hover:bg-rose-50 text-rose-600 font-bold">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(student)} title="Modify Intel" className="group-hover:text-blue-600">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)} title="Move to Trash" className="group-hover:text-rose-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Admission Number</label>
              <Input value={admissionNumber} onChange={e => setAdmissionNumber(e.target.value)} placeholder="e.g. STU-2025-001" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Status</label>
               <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-slate-900/10 transition-all text-sm">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Graduated">Graduated</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Parent/Guardian Name</label>
              <Input value={parentName} onChange={e => setParentName(e.target.value)} placeholder="e.g. John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Parent/Guardian Contact</label>
              <Input value={parentContact} onChange={e => setParentContact(e.target.value)} placeholder="e.g. 0244123456" />
            </div>
            <div className="space-y-2 col-span-1 sm:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Residential Address</label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Plot 15, Accra" />
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
