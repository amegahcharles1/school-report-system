'use client';

import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Save, Percent, Award, BookOpen, 
  User as UserIcon, Building2, Layout, Plus, Trash2, ShieldCheck, 
  ChevronRight, Calculator, GraduationCap, Image as ImageIcon, Calendar, FileText, UploadCloud, Loader2, CalendarRange, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const queryClient = useQueryClient();

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('school'); // school, report, grading, marks, layout

  const [settings, setSettings] = useState<any>({
    schoolName: '',
    schoolMotto: '',
    department: '',
    schoolAddress: '',
    schoolPhone: '',
    schoolEmail: '',
    logoUrl: '',
    currentTermId: '',
    currentYearId: '',
    
    // Reports
    nextTermDate: '',
    teacherRemark: '',
    headteacherRemark: '',
    reportFooterText: 'Wishing all students a fruitful stay...',
    showAttendance: true,
    showNextTermDate: true,
    showPositions: true,

    // Marks
    caWeight: 40,
    examWeight: 60,
    passingScore: 50,
    
    // Layout
    reportTitle: 'STUDENT PROGRESS REPORT',
    headTeacherName: 'ADMINISTRATOR',
    columnWidth: 100,

    // Terminology
    test1Label: 'Test 1',
    assignment1Label: 'Assign 1',
    test2Label: 'Test 2',
    assignment2Label: 'Assign 2',
    examLabel: 'Exam',
    studentLabel: 'Student Name',
    subjectLabel: 'Subject of Learning',
    caSubtotalLabel: 'CA Subtotal',
    caWeightLabel: 'CA',
    examWeightLabel: 'Exam',
    finalTotalLabel: 'Final Total',
    gradeLabel: 'Grade',
    remarksLabel: 'Remarks / Comment',
    classTeacherLabel: 'Class Teacher',
    headTeacherLabel: 'Head Teacher',
    totalMarksLabel: 'Total Marks',
    averageLabel: 'Average %',
    positionLabel: 'Class Position',
    classAverageLabel: 'Class Average',
    highestScoreLabel: 'Highest Score',
    lowestScoreLabel: 'Lowest Score',
  });

  const [grades, setGrades] = useState<any[]>([]);

  // Fetch Settings & Grades
  const { isLoading: loadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (!data.error) setSettings((prev: any) => ({ ...prev, ...data }));
      return data;
    }
  });

  const { isLoading: loadingGrades } = useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const res = await fetch('/api/grades');
      const data = await res.json();
      if (!data.error) setGrades(data);
      return data;
    }
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['terms'],
    queryFn: async () => {
      const res = await fetch('/api/terms');
      if (!res.ok) throw new Error('API failed');
      return res.json();
    }
  });

  const { data: years = [], refetch: refetchYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const res = await fetch('/api/academic-years');
      if (!res.ok) throw new Error('API failed');
      return res.json();
    }
  });

  const [newYearName, setNewYearName] = useState('');

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const val = type === 'checkbox' ? e.target.checked : 
                type === 'number' ? parseFloat(value) : value;
    setSettings((prev: any) => ({ ...prev, [name]: val }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Clean relationships or nested info
      const { currentTerm, ...safeSettings } = settings;
      
      const [settingsRes, gradesRes] = await Promise.all([
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(safeSettings)
        }),
        fetch('/api/grades', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grades })
        })
      ]);
      
      if (!settingsRes.ok || !gradesRes.ok) throw new Error('Failed to save configuration');
      return true;
    },
    onSuccess: () => {
      toast.success('System settings applied globally');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error executing save request');
    }
  });

  const handleSaveAll = () => {
    saveMutation.mutate();
  };

  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to upload image');
      
      setSettings((prev: any) => ({ ...prev, logoUrl: data.url }));
      toast.success('Logo uploaded successfully! Save configuration to apply.');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  // --- Grading Management ---
  const addGrade = () => {
    setGrades([...grades, { minScore: 0, maxScore: 0, grade: '', remark: '' }]);
  };

  const removeGrade = (index: number) => {
    setGrades(grades.filter((_, i) => i !== index));
  };

  const handleGradeChange = (index: number, field: string, value: any) => {
    const updated = [...grades];
    updated[index][field] = field.includes('Score') ? parseFloat(value) : value;
    setGrades(updated);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[70vh]">
        <ShieldCheck className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Access Required</h2>
        <p className="text-gray-500 mt-2">Only administrators can modify system settings.</p>
      </div>
    );
  }

  if (loadingSettings || loadingGrades) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Synchronizing configurations...</p>
      </div>
    );
  }

  const selectedTermObj = terms.find((t: any) => t.id === settings.currentTermId);

  const [creatingYear, setCreatingYear] = useState(false);

  const handleCreateYear = async () => {
    if (!newYearName.trim()) {
      toast.error('Enter an academic year name (e.g. 2026/2027)');
      return;
    }
    setCreatingYear(true);
    try {
      const res = await fetch('/api/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newYearName, isCurrent: false })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('New Academic Year instantiated with 3 internal terms!');
      setNewYearName('');
      refetchYears();
    } catch (err: any) {
      toast.error(err.message || 'Creation failed');
    } finally {
      setCreatingYear(false);
    }
  };

  const tabs = [
    { id: 'school', label: '1. School Profile', icon: Building2 },
    { id: 'report', label: '2. Report System', icon: FileText },
    { id: 'grading', label: '3. Grading System', icon: GraduationCap },
    { id: 'marks', label: '4. Marks Configuration', icon: Calculator },
    { id: 'layout', label: '5. Terminology & Layout', icon: Layout },
    { id: 'sessions', label: '6. Academic Sessions', icon: CalendarRange }
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-24">
      {/* Header Sticky Container */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur top-0 z-10 py-4 sticky border-b border-transparent dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-indigo-600" /> Executive Settings
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Fully control platform behavior & layout dynamically.</p>
        </div>
        <button 
          onClick={handleSaveAll} 
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-6 py-3 w-full md:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all font-bold text-sm"
        >
          <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Syncing...' : 'Save Configuration'}
        </button>
      </div>

      {/* Tabs Menu (Mobile Responsive Scroll) */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden transition-all duration-300">
        
        {/* TAB 1: School Profile */}
        {activeTab === 'school' && (
          <div className="p-6 md:p-8 space-y-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Building2 className="w-6 h-6 text-indigo-500" />
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">School Identity & Structure</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-black uppercase text-gray-500 mb-2">School Name</label>
                <input type="text" name="schoolName" value={settings.schoolName || ''} onChange={handleSettingsChange} className="settings-input" placeholder="Official Institution Name" />
              </div>
              <div className="col-span-1 md:col-span-2 lg:col-span-1">
                <label className="block text-xs font-black uppercase text-gray-500 mb-2">Department</label>
                <input type="text" name="department" value={settings.department || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Basic Education" />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-black uppercase text-gray-500 mb-2">School Motto</label>
                <input type="text" name="schoolMotto" value={settings.schoolMotto || ''} onChange={handleSettingsChange} className="settings-input" placeholder="Core philosophy and motto" />
              </div>
              
              <div className="col-span-1">
                <label className="block text-xs font-black uppercase text-gray-500 mb-2">Headteacher Name</label>
                <input type="text" name="headTeacherName" value={settings.headTeacherName || ''} onChange={handleSettingsChange} className="settings-input" placeholder="Name of principal/head" />
              </div>

              <div className="col-span-1 md:col-span-3 border-t border-slate-100 dark:border-slate-800 pt-6 mt-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-2">Current Active Term</label>
                  <select 
                    name="currentTermId" 
                    value={settings.currentTermId || ''} 
                    onChange={handleSettingsChange} 
                    className="settings-input bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30"
                  >
                    <option value="">Select current Term...</option>
                    {terms.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.academicYear?.name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-2">Academic Year</label>
                  <input type="text" disabled value={selectedTermObj?.academicYear?.name || 'N/A'} className="settings-input opacity-60 bg-gray-100 cursor-not-allowed" />
                  <p className="text-[10px] text-slate-400 mt-1">Derived from selected term automatically.</p>
                </div>
              </div>

              <div className="col-span-1 md:col-span-3 border-t border-slate-100 dark:border-slate-800 pt-6 mt-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-black uppercase text-gray-500 mb-2">Official Address</label>
                  <input type="text" name="schoolAddress" value={settings.schoolAddress || ''} onChange={handleSettingsChange} className="settings-input" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-black uppercase text-gray-500 mb-2">School Logo Configuration</label>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-3">
                      <input type="text" name="logoUrl" value={settings.logoUrl || ''} onChange={handleSettingsChange} className="settings-input font-mono text-sm flex-1" placeholder="HTTPS Link or /uploads/... path" />
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <label className={`flex items-center justify-center gap-2 px-6 py-2 border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl cursor-pointer transition-all ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                         {uploadingLogo ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                         <span className="font-bold text-sm">{uploadingLogo ? 'Uploading...' : 'Upload Locally Image'}</span>
                         <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                      </label>
                      <p className="text-[10px] text-slate-400">Supported rules: JPG, PNG, WEBP. Max size: 2MB.</p>
                    </div>
                  </div>
                </div>
                {settings.logoUrl && (
                  <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 relative">
                    <img src={settings.logoUrl} alt="Logo Preview" className="max-h-20 max-w-[150px] object-contain" onError={(e) => { (e.target as HTMLImageElement).src = ''; }} />
                    <button onClick={() => setSettings({...settings, logoUrl: ''})} className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-bold text-gray-400 mt-2">Active Preview</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Report System Settings */}
        {activeTab === 'report' && (
          <div className="p-6 md:p-8 space-y-10 animate-fade-in">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <FileText className="w-6 h-6 text-indigo-500" />
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Report Document Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-2">Next Term Begins Date</label>
                  <input type="date" name="nextTermDate" value={settings.nextTermDate || ''} onChange={handleSettingsChange} className="settings-input" />
                </div>
                
                <div className="p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Visibility Toggles</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Show Attendance on Report</p>
                      <p className="text-xs text-gray-500">Display student attendace metrics</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="showAttendance" checked={!!settings.showAttendance} onChange={handleSettingsChange} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Show Next Term Date</p>
                      <p className="text-xs text-gray-500">Display resumption date if entered above</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="showNextTermDate" checked={!!settings.showNextTermDate} onChange={handleSettingsChange} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Show Class Position</p>
                      <p className="text-xs text-gray-500">Compute rankings for broadsheets automatically</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="showPositions" checked={!!settings.showPositions} onChange={handleSettingsChange} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-2">{settings.classTeacherLabel || 'Class Teacher'} Remark Default</label>
                  <textarea name="teacherRemark" value={settings.teacherRemark || ''} onChange={handleSettingsChange} rows={3} className="settings-input min-h-[80px]" placeholder="Excellent performance." />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-2">{settings.headTeacherLabel || 'Head Teacher'} Remark Default</label>
                  <textarea name="headteacherRemark" value={settings.headteacherRemark || ''} onChange={handleSettingsChange} rows={3} className="settings-input min-h-[80px]" placeholder="An outstanding term. Keep it up." />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-2">Report Document Footer Text</label>
                  <textarea name="reportFooterText" value={settings.reportFooterText || ''} onChange={handleSettingsChange} rows={2} className="settings-input text-xs" placeholder="Wishing all students..." />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Grading System */}
        {activeTab === 'grading' && (
          <div className="p-6 md:p-8 space-y-8 animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-indigo-500" />
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Grading System Definition</h2>
              </div>
              <button 
                onClick={addGrade}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Grade Scale Row
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-4 text-left font-black text-slate-500 text-xs uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Min Score</th>
                    <th className="px-4 py-4 text-left font-black text-slate-500 text-xs uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Max Score</th>
                    <th className="px-4 py-4 text-left font-black text-slate-500 text-xs uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Letter Grade</th>
                    <th className="px-4 py-4 text-left font-black text-slate-500 text-xs uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Default Remarks</th>
                    <th className="px-4 py-4 text-right border-b border-slate-100 dark:border-slate-800"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {grades.map((grade, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                      <td className="px-4 py-3">
                        <input type="number" value={grade.minScore} onChange={e => handleGradeChange(idx, 'minScore', e.target.value)} className="w-24 settings-input" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" value={grade.maxScore} onChange={e => handleGradeChange(idx, 'maxScore', e.target.value)} className="w-24 settings-input" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={grade.grade} onChange={e => handleGradeChange(idx, 'grade', e.target.value)} className="w-20 settings-input text-center font-black text-indigo-700" placeholder="A+" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={grade.remark} onChange={e => handleGradeChange(idx, 'remark', e.target.value)} className="w-full settings-input" placeholder="Excellent" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => removeGrade(idx)} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {grades.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">Click "Add Grade Scale Row" to define calculation rubrics.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-start gap-4 p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                <span className="font-black">Notice:</span> Validations apply in sequence. 80–100 = A = Excellent | 70–79 = B = Very Good. Make sure max scores don't overlap to retain calculation accuracy during reports crunching.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: Marks Configuration */}
        {activeTab === 'marks' && (
          <div className="p-6 md:p-8 space-y-8 animate-fade-in">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Calculator className="w-6 h-6 text-indigo-500" />
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Marks Core Logic Setup</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center justify-between">
                    Continuous Assessment (CA) Percentage
                    <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg text-sm font-black shadow-inner">{settings.caWeight}%</span>
                  </label>
                  <input 
                    type="range" name="caWeight" min="0" max="100" step="1" 
                    value={settings.caWeight || 40} 
                    onChange={(e) => setSettings({...settings, caWeight: parseInt(e.target.value), examWeight: 100 - parseInt(e.target.value)})} 
                    className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                  />
                  <p className="text-xs text-slate-400 mt-2 font-medium">Controls the conversion factor for 4 assessment fields.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center justify-between">
                    Final Examination Percentage
                    <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-sm font-black shadow-inner">{settings.examWeight}%</span>
                  </label>
                  <input 
                    type="range" name="examWeight" min="0" max="100" step="1" 
                    value={settings.examWeight || 60} 
                    onChange={(e) => setSettings({...settings, examWeight: parseInt(e.target.value), caWeight: 100 - parseInt(e.target.value)})} 
                    className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                  />
                  <p className="text-xs text-slate-400 mt-2 font-medium">Controls exam conversion against 100%.</p>
                </div>
                
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-black uppercase text-gray-500 mb-4 tracking-widest">Base Passing Score Minimum</label>
                  <input type="number" name="passingScore" value={settings.passingScore || 50} onChange={handleSettingsChange} className="settings-input max-w-[200px] text-xl font-bold font-mono" />
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 md:p-8 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
                <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest mb-6">Explanatory Logic Matrix</h4>
                
                <ul className="space-y-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                    <p>CA Components: {settings.test1Label} (25) + {settings.assignment1Label} (25) + {settings.test2Label} (25) + {settings.assignment2Label} (25) = 100 max points.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                    <p>CA Contribution: CA Total × <strong>{settings.caWeight}%</strong></p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                    <p>Exam Contribution: Exam Score × <strong>{settings.examWeight}%</strong></p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                    <p>Final Total Formulation: Expected computation equals CA% + Exam% (Target 100 points maximum).</p>
                  </li>
                  <li className="flex items-start gap-3 pt-4 border-t border-indigo-100 dark:border-indigo-900/50 mt-4">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-rose-400 shrink-0"></span>
                    <p>Students scoring below <strong>{settings.passingScore}</strong> points will fail according to default configurations algorithms.</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Terminology & Layout */}
        {activeTab === 'layout' && (
          <div className="p-6 md:p-8 space-y-10 animate-fade-in">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Layout className="w-6 h-6 text-indigo-500" />
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Global Terminology Controls</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="col-span-1 md:col-span-2 lg:col-span-4 mb-4">
                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Minimum Column Width (px)</p>
                    <p className="text-xs text-gray-500 mt-1">Controls horizontal spread of cells identically mapped in marks entry matrix.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" name="columnWidth" min="60" max="250" step="10" 
                      value={settings.columnWidth || 100} 
                      onChange={handleSettingsChange}
                      className="w-32 md:w-48 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                    />
                    <span className="bg-white dark:bg-slate-800 px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-black shadow-sm w-20 text-center text-slate-800 dark:text-slate-200">{settings.columnWidth || 100}px</span>
                  </div>
                </div>
              </div>

              {/* Assessment Group */}
              <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-6">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">Assessment Labels</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Column 1 Label</label><input type="text" name="test1Label" value={settings.test1Label || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Column 2 Label</label><input type="text" name="assignment1Label" value={settings.assignment1Label || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Column 3 Label</label><input type="text" name="test2Label" value={settings.test2Label || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Column 4 Label</label><input type="text" name="assignment2Label" value={settings.assignment2Label || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">CA Subtotal Label</label><input type="text" name="caSubtotalLabel" value={settings.caSubtotalLabel || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Exam Column Label</label><input type="text" name="examLabel" value={settings.examLabel || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">CA Weight Label (Sht)</label><input type="text" name="caWeightLabel" value={settings.caWeightLabel || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Exam Weight (Sht)</label><input type="text" name="examWeightLabel" value={settings.examWeightLabel || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Final Total Label</label><input type="text" name="finalTotalLabel" value={settings.finalTotalLabel || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Grade Column</label><input type="text" name="gradeLabel" value={settings.gradeLabel || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Remarks Column</label><input type="text" name="remarksLabel" value={settings.remarksLabel || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                </div>
              </div>

               {/* Meta Group */}
               <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-8">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">Layout & Meta Labels</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Student Column Label</label><input type="text" name="studentLabel" value={settings.studentLabel || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Subject Column Label</label><input type="text" name="subjectLabel" value={settings.subjectLabel || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Class Teacher Design</label><input type="text" name="classTeacherLabel" value={settings.classTeacherLabel || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Head Teacher Design</label><input type="text" name="headTeacherLabel" value={settings.headTeacherLabel || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Total Marks Label</label><input type="text" name="totalMarksLabel" value={settings.totalMarksLabel || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Average % Label</label><input type="text" name="averageLabel" value={settings.averageLabel || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Class Rank/Pos Label</label><input type="text" name="positionLabel" value={settings.positionLabel || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Class Average Label</label><input type="text" name="classAverageLabel" value={settings.classAverageLabel || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Highest Score Label</label><input type="text" name="highestScoreLabel" value={settings.highestScoreLabel || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Lowest Score Label</label><input type="text" name="lowestScoreLabel" value={settings.lowestScoreLabel || ''} onChange={handleSettingsChange} className="settings-input" /></div>
                </div>
              </div>
             </div>
          </div>
        )}

        {/* TAB 6: Academic Sessions */}
        {activeTab === 'sessions' && (
          <div className="p-6 md:p-8 space-y-10 animate-fade-in">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <CalendarRange className="w-6 h-6 text-indigo-500" />
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Academic Sessions Engine</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-1">Establish New Academic Year</h3>
                  <p className="text-xs text-slate-500 mb-4">Initializes a completely isolated academic calendar matrix bridging assignments, marks, and broader archives seamlessly. 3 default terms will be auto-generated.</p>
                  
                  <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      value={newYearName} 
                      onChange={e => setNewYearName(e.target.value)} 
                      className="settings-input flex-1 font-mono text-sm uppercase" 
                      placeholder="e.g. 2026/2027" 
                    />
                    <button 
                      onClick={handleCreateYear}
                      disabled={creatingYear}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl shadow-md transition-all text-sm shrink-0"
                    >
                      {creatingYear ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Spawn Year
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">System Architecture Index</h3>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 rounded-2xl">
                  {Array.isArray(years) && years.map((y: any) => (
                    <div key={y.id} className="p-5 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-black text-lg text-indigo-900 dark:text-indigo-400 font-mono">{y.name}</h4>
                        <div className="flex gap-2 text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {Array.isArray(y.terms) ? y.terms.length : 0} Terms</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(y.terms) && y.terms.map((t: any) => (
                          <div key={t.id} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${settings.currentTermId === t.id ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'}`}>
                            {t.name}
                            {settings.currentTermId === t.id && <span className="ml-2 bg-indigo-500 text-white px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest">Active</span>}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-4 italic font-medium tracking-tight">To switch the globally active term and year, select it from the dropdown in "1. School Profile".</p>
                    </div>
                  ))}
                  {(!Array.isArray(years) || years.length === 0) && (
                    <div className="p-10 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">No Academic Calendars initialized.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .settings-input {
          width: 100%;
          padding: 0.75rem 1.25rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          background: #f8fafc;
          font-size: 0.875rem;
          font-weight: 600;
          outline: none;
          transition: all 0.2s;
        }
        .dark .settings-input {
          background: rgba(30, 41, 59, 0.5);
          border-color: #334155;
          color: white;
        }
        .settings-input:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
          background: white;
        }
        .dark .settings-input:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.1);
          background: rgba(15, 23, 42, 1);
        }
      `}</style>
    </div>
  );
}
