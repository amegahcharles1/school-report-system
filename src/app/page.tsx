'use client';

import { DashboardStats } from '@/types';
import { Users, BookOpen, School, TrendingUp, TrendingDown, Award, ClipboardEdit, FileText, BarChart3, Loader2, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';

export default function Dashboard() {
  const { data: stats, isLoading: loading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      return res.json();
    }
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800/50 rounded-lg"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="premium-card p-6 h-32 flex items-center justify-between">
              <div className="space-y-3">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
              <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-full"></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="premium-card p-6 h-80">
              <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-8"></div>
              <div className="w-full h-56 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"></div>
            </div>
          </div>
          <div className="premium-card p-6 h-80">
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg mb-8"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 bg-slate-200 dark:bg-slate-800 rounded-full mt-2"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full bg-slate-50 dark:bg-slate-800 rounded"></div>
                    <div className="h-3 w-2/3 bg-slate-50 dark:bg-slate-800/50 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in mb-10">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Intelligence overview of academic performance & records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <div className="premium-card p-6 group transition-all duration-300 hover:shadow-blue-500/10 active:scale-95">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats?.totalStudents || 0}</h3>
            </div>
            <div className="h-14 w-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="success" className="text-[10px]">Active Session</Badge>
          </div>
        </div>

        {/* Total Subjects */}
        <div className="premium-card p-6 group transition-all duration-300 hover:shadow-purple-500/10 active:scale-95">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Curriculum</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats?.totalSubjects || 0}</h3>
            </div>
            <div className="h-14 w-14 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <BookOpen className="h-7 w-7 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">Registered Subjects</p>
        </div>

        {/* Total Classes */}
        <div className="premium-card p-6 group transition-all duration-300 hover:shadow-emerald-500/10 active:scale-95">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Departments</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats?.totalClasses || 0}</h3>
            </div>
            <div className="h-14 w-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <School className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">Active Grade Levels</p>
        </div>

        {/* Best Student Average */}
        <div className="premium-card p-6 group transition-all duration-300 border-amber-200/50 dark:border-amber-900/30 hover:shadow-amber-500/10 active:scale-95">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Performant</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{stats?.bestStudent?.average || 0}%</h3>
            </div>
            <div className="h-14 w-14 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center relative transition-transform group-hover:scale-110">
              <Award className="h-7 w-7 text-amber-500" />
            </div>
          </div>
          {stats?.bestStudent && (
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-4 truncate">
              {stats.bestStudent.name}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Analytics Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Grade Distribution Chart */}
          <div className="premium-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Performance Analytics</h3>
              <Badge variant="outline">Grade Distribution</Badge>
            </div>
            <div className="h-80 w-full font-bold">
              {stats?.gradeDistribution && stats.gradeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.gradeDistribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="grade" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12}} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12}} 
                    />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}} 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', background: '#fff'}} 
                    />
                    <Bar 
                      dataKey="count" 
                      fill="url(#barGradient)" 
                      radius={[8, 8, 8, 8]} 
                      barSize={45} 
                    />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#60a5fa" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <BarChart3 className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">No curriculum data available for analysis.</p>
                </div>
              )}
            </div>
          </div>

          {/* Pass/Fail Metrics */}
          <div className="premium-card p-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Success Metrics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-2 space-y-8">
                <div>
                  <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      Global Pass Rate
                    </span>
                    <span className="text-emerald-600">{stats?.passRate || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.3)]" 
                      style={{ width: `${stats?.passRate || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                      Failure Deficiency
                    </span>
                    <span className="text-rose-500">{stats?.failRate || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${stats?.failRate || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-950/20 rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-inner group">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Class Mean</p>
                <div className="text-5xl font-black text-slate-900 dark:text-white transition-transform group-hover:scale-110 duration-500">
                  {stats?.classAverage || 0}
                  <small className="text-xl">%</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-8">
          {/* Recent Activity Feed */}
          <div className="premium-card p-6 flex flex-col h-full">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-blue-600" /> Audit Logs
            </h3>
            
            <div className="space-y-6 flex-1">
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="mt-1 flex flex-col items-center">
                      <div className="w-3 h-3 border-2 border-blue-600 bg-white dark:bg-slate-900 rounded-full z-10 group-hover:scale-125 transition-transform"></div>
                      {idx !== stats.recentActivity!.length - 1 && <div className="w-0.5 h-full bg-slate-100 dark:bg-slate-800 -mt-1 mb-1"></div>}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                        <span className="text-blue-600">{activity.modifiedBy?.name || 'Authorized'}</span>{' '}
                        adjusted <span className="underline decoration-slate-200">{activity.field}</span> for{' '}
                        {activity.assessment?.student?.firstName} {activity.assessment?.student?.lastName}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4">{activity.assessment?.subject?.name}</Badge>
                        <time className="text-[10px] text-slate-400 font-medium">{new Date(activity.createdAt).toLocaleDateString()}</time>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-10 h-10 mb-3 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
                    <ClipboardEdit className="w-4 h-4 opacity-30" />
                  </div>
                  <p className="text-xs font-bold">No modifications tracked</p>
                </div>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Express Navigation</h4>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/marks" className="dashboard-action-btn">
                  <ClipboardEdit className="w-4 h-4" />
                  <span>Entry</span>
                </Link>
                <Link href="/students" className="dashboard-action-btn">
                  <Users className="w-4 h-4" />
                  <span>Roster</span>
                </Link>
                <Link href="/report-cards" className="dashboard-action-btn">
                  <FileText className="w-4 h-4" />
                  <span>Reports</span>
                </Link>
                <Link href="/results" className="dashboard-action-btn">
                  <BarChart3 className="w-4 h-4" />
                  <span>Stats</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .dashboard-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          border-radius: 20px;
          background: #fff;
          border: 1px solid #f1f5f9;
          font-size: 11px;
          font-weight: 800;
          color: #64748b;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
        }
        :global(.dark) .dashboard-action-btn {
          background: #0f172a;
          border-color: #1e293b;
          color: #94a3b8;
        }
        .dashboard-action-btn:hover {
          transform: translateY(-4px);
          border-color: #3b82f6;
          color: #3b82f6;
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.1);
          background: #f0f7ff;
        }
        :global(.dark) .dashboard-action-btn:hover {
          background: rgba(59, 130, 246, 0.05);
        }
      `}</style>
    </div>
  );
}
