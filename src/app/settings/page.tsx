'use client';

import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Save, Percent, Award, BookOpen, 
  User as UserIcon, Building2, Layout, Plus, Trash2, ShieldCheck, 
  ChevronRight, Calculator, GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('school'); // school, assessment, grading

  const [settings, setSettings] = useState<any>({
    schoolName: '',
    schoolMotto: '',
    schoolAddress: '',
    schoolPhone: '',
    schoolEmail: '',
    reportCardMessage: '',
    reportTitle: 'STUDENT PROGRESS REPORT',
    headTeacherName: 'ADMINISTRATOR',
    caWeight: 40,
    examWeight: 60,
    gradingStyle: 'Standard',
    showPositions: true,
    showAverages: true,
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
    columnWidth: 100,
  });

  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, gradesRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/grades')
      ]);
      
      const settingsData = await settingsRes.json();
      if (settingsData && !settingsData.error) {
        setSettings(settingsData);
      }

      const gradesData = await gradesRes.json();
      if (gradesData && !gradesData.error) {
        setGrades(gradesData);
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                type === 'number' ? parseFloat(value) : value;
    setSettings(prev => ({ ...prev, [name]: val }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (res.ok) {
        toast.success('Settings updated successfully');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save settings');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setSaving(false);
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

  const saveGrades = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/grades', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades })
      });
      
      if (res.ok) {
        toast.success('Grading system updated');
      } else {
        toast.error('Failed to save grades');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
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

  if (loading) return <div className="p-12 text-center text-gray-500 animate-pulse">Loading system configuration...</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-slate-800" /> Administrator Control Panel
          </h1>
          <p className="text-gray-500 mt-1">Configure school identity, assessment rules, and grading system</p>
        </div>
        <button 
          onClick={activeTab === 'grading' ? saveGrades : saveSettings} 
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl shadow-lg transition-all transform active:scale-95 font-medium"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving Changes...' : 'Save All Changes'}
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
        {[
          { id: 'school', label: 'School & Reports', icon: Building2 },
          { id: 'assessment', label: 'Assessment Rules', icon: Calculator },
          { id: 'terminology', label: 'Terminology', icon: Layout },
          { id: 'grading', label: 'Grading System', icon: GraduationCap }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden transition-all duration-300">
        
        {/* TAB 1: School & Reports */}
        {activeTab === 'school' && (
          <div className="p-6 md:p-8 space-y-10 animate-fade-in">
            <section>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <Building2 className="w-4 h-4" /> School Identity & Headings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">School Name</label>
                  <input type="text" name="schoolName" value={settings.schoolName} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. ST. JOSEPH JHS" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">School Motto</label>
                  <input type="text" name="schoolMotto" value={settings.schoolMotto} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Knowledge is Power" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Official Address</label>
                  <input type="text" name="schoolAddress" value={settings.schoolAddress} onChange={handleSettingsChange} className="settings-input" placeholder="P.O. Box..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                  <input type="text" name="schoolPhone" value={settings.schoolPhone} onChange={handleSettingsChange} className="settings-input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                  <input type="email" name="schoolEmail" value={settings.schoolEmail} onChange={handleSettingsChange} className="settings-input" />
                </div>
              </div>
            </section>

            <section className="bg-slate-50 dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                <Layout className="w-4 h-4" /> Report Card Layout Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Report Document Title</label>
                  <input type="text" name="reportTitle" value={settings.reportTitle} onChange={handleSettingsChange} className="settings-input border-slate-200" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Head Teacher Name / Title</label>
                  <input type="text" name="headTeacherName" value={settings.headTeacherName} onChange={handleSettingsChange} className="settings-input border-slate-200" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Custom Report Bottom Message</label>
                  <textarea name="reportCardMessage" value={settings.reportCardMessage} onChange={handleSettingsChange} rows={2} className="settings-input border-slate-200 px-4 py-2" placeholder="Wishing all students a fruitful stay..." />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: Assessment Rules */}
        {activeTab === 'assessment' && (
          <div className="p-6 md:p-8 space-y-10 animate-fade-in">
            <section>
              <div className="flex items-start gap-4 mb-8 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <Plus className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm">Weighting Configuration</h4>
                  <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">Control the percentage contribution of Continuous Assessment and Final Exams to the student's final score.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center justify-between">
                      Continuous Assessment (CA) Weight (%)
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-black">{settings.caWeight}%</span>
                    </label>
                    <input 
                      type="range" name="caWeight" min="0" max="100" step="1" 
                      value={settings.caWeight} 
                      onChange={(e) => {
                        const ca = parseInt(e.target.value);
                        setSettings({...settings, caWeight: ca, examWeight: 100 - ca});
                      }} 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-slate-800" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center justify-between">
                      Final Examination Weight (%)
                      <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-black">{settings.examWeight}%</span>
                    </label>
                    <input 
                      type="range" name="examWeight" min="0" max="100" step="1" 
                      value={settings.examWeight} 
                      onChange={(e) => {
                        const exam = parseInt(e.target.value);
                        setSettings({...settings, examWeight: exam, caWeight: 100 - exam});
                      }} 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-slate-800" 
                    />
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Display Settings</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Show Class Positions</p>
                      <p className="text-xs text-gray-500">Enable automatic ranking based on final average</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="showPositions" checked={settings.showPositions} onChange={handleSettingsChange} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-800"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Show Subject Averages</p>
                      <p className="text-xs text-gray-500">Include highest/lowest/class average stats</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="showAverages" checked={settings.showAverages} onChange={handleSettingsChange} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-800"></div>
                    </label>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: Terminology & Custom Labels */}
        {activeTab === 'terminology' && (
          <div className="p-6 md:p-8 space-y-10 animate-fade-in">
            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <Layout className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-blue-300">System Terminology Control</h4>
                  <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
                    Customize every word and label used across the system. This allows you to adapt the system to your school's specific curriculum and naming conventions.
                  </p>
                </div>
              </div>
            </div>

            <section className="bg-white dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                <Layout className="w-4 h-4" /> Column Width & Layout
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Minimum Column Width (Pixels)</p>
                      <p className="text-xs text-gray-500">Adjust the width of assessment cells for better visibility</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-black text-slate-800">{settings.columnWidth || 100}px</span>
                      <input 
                        type="range" name="columnWidth" min="60" max="250" step="10" 
                        value={settings.columnWidth || 100} 
                        onChange={handleSettingsChange}
                        className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-slate-800" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700 col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="col-span-3 mb-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Custom assessment & terminology labels</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Column 1 Label</label>
                    <input type="text" name="test1Label" value={settings.test1Label || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Test 1 / Project" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Column 2 Label</label>
                    <input type="text" name="assignment1Label" value={settings.assignment1Label || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Assign 1" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Column 3 Label</label>
                    <input type="text" name="test2Label" value={settings.test2Label || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Test 2" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Column 4 Label</label>
                    <input type="text" name="assignment2Label" value={settings.assignment2Label || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Assign 2" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Exam Column Label</label>
                    <input type="text" name="examLabel" value={settings.examLabel || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Exam" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Student Name Column</label>
                    <input type="text" name="studentLabel" value={settings.studentLabel || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Learner Name" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Subject Column</label>
                    <input type="text" name="subjectLabel" value={settings.subjectLabel || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Subject" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">CA Subtotal Label</label>
                    <input type="text" name="caSubtotalLabel" value={settings.caSubtotalLabel || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Formative Total" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">CA Weight Label (Short)</label>
                    <input type="text" name="caWeightLabel" value={settings.caWeightLabel || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. CA / Class Work" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Exam Weight Label (Short)</label>
                    <input type="text" name="examWeightLabel" value={settings.examWeightLabel || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Summative / Exam" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Final Total Label</label>
                    <input type="text" name="finalTotalLabel" value={settings.finalTotalLabel || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Aggregate Score" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Grade Column</label>
                    <input type="text" name="gradeLabel" value={settings.gradeLabel || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Level" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Remarks Column</label>
                    <input type="text" name="remarksLabel" value={settings.remarksLabel || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Recommendation" />
                  </div>
                </div>

                <div className="space-y-4 pt-6 mt-4 border-t border-slate-200 dark:border-slate-700 col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2 mb-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Role designations</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Class Teacher Designation</label>
                    <input type="text" name="classTeacherLabel" value={settings.classTeacherLabel || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Form Teacher" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Head Teacher Designation</label>
                    <input type="text" name="headTeacherLabel" value={settings.headTeacherLabel || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Principal / Headmaster" />
                  </div>
                </div>

                <div className="space-y-4 pt-6 mt-4 border-t border-slate-200 dark:border-slate-700 col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="col-span-3 mb-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Report Statistics Labels</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Total Marks Label</label>
                    <input type="text" name="totalMarksLabel" value={settings.totalMarksLabel || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Total Score" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Average % Label</label>
                    <input type="text" name="averageLabel" value={settings.averageLabel || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Percentage" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Class Position Label</label>
                    <input type="text" name="positionLabel" value={settings.positionLabel || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Rank" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Class Average Label</label>
                    <input type="text" name="classAverageLabel" value={settings.classAverageLabel || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Group Mean" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Highest Score Label</label>
                    <input type="text" name="highestScoreLabel" value={settings.highestScoreLabel || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Peak" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Lowest Score Label</label>
                    <input type="text" name="lowestScoreLabel" value={settings.lowestScoreLabel || ''} onChange={handleSettingsChange} className="settings-input" placeholder="e.g. Minimum" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: Grading System */}
        {activeTab === 'grading' && (
          <div className="p-6 md:p-8 space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Award className="w-4 h-4" /> Grading Scale Configuration
                </h3>
                <p className="text-xs text-gray-500 mt-1">Define the score ranges for grades and performance metrics.</p>
              </div>
              <button 
                onClick={addGrade}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-all"
              >
                <Plus className="w-4 h-4" /> Add Grade Range
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-500">Min Score</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500">Max Score</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500">Letter Grade</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500">Default Remark</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {grades.map((grade, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2">
                        <input type="number" value={grade.minScore} onChange={e => handleGradeChange(idx, 'minScore', e.target.value)} className="w-20 px-2 py-1 bg-white dark:bg-gray-800 border rounded outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" value={grade.maxScore} onChange={e => handleGradeChange(idx, 'maxScore', e.target.value)} className="w-20 px-2 py-1 bg-white dark:bg-gray-800 border rounded outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={grade.grade} onChange={e => handleGradeChange(idx, 'grade', e.target.value)} className="w-16 px-2 py-1 bg-white dark:bg-gray-800 border rounded outline-none font-black text-center" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={grade.remark} onChange={e => handleGradeChange(idx, 'remark', e.target.value)} className="w-full px-2 py-1 bg-white dark:bg-gray-800 border rounded outline-none" />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => removeGrade(idx)} className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {grades.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400 italic">No grading configuration found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <strong>Note:</strong> Overlapping score ranges may cause calculation inconsistencies. Ensure that your Min and Max scores follow a continuous, non-overlapping sequence.
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .settings-input {
          width: 100%;
          padding: 0.6rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          background: #f8fafc;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }
        .dark .settings-input {
          background: #1e293b;
          border-borderColor: #334155;
          color: white;
        }
        .settings-input:focus {
          border-color: #0f172a;
          box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.05);
          background: white;
        }
        .dark .settings-input:focus {
          border-color: #cbd5e1;
          background: #0f172a;
        }
      `}</style>
    </div>
  );
}
