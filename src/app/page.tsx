'use client';

import { useEffect, useState } from 'react';
import { DashboardStats } from '@/types';
import { Users, BookOpen, School, TrendingUp, TrendingDown, Award, ClipboardEdit, FileText, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg mb-2"></div>
          <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800/50 rounded-lg"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-28">
              <div className="flex justify-between items-center h-full">
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
                <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-80">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-6"></div>
              <div className="w-full h-56 bg-gray-100 dark:bg-gray-800/50 rounded-lg"></div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-64">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-6"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 bg-gray-200 dark:bg-gray-800 rounded-full mt-2"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded"></div>
                      <div className="h-3 w-2/3 bg-gray-50 dark:bg-gray-800/50 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome to your school management system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 card-hover hidden md:block animate-fade-in" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats?.totalStudents || 0}</h3>
            </div>
            <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Total Subjects */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 card-hover animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Subjects</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats?.totalSubjects || 0}</h3>
            </div>
            <div className="h-12 w-12 bg-purple-50 dark:bg-purple-900/40 rounded-full flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Total Classes */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 card-hover animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Classes</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats?.totalClasses || 0}</h3>
            </div>
            <div className="h-12 w-12 bg-green-50 dark:bg-green-900/40 rounded-full flex items-center justify-center">
              <School className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Best Student Average */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 card-hover animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Top Average</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats?.bestStudent?.average || 0}%</h3>
            </div>
            <div className="h-12 w-12 bg-amber-50 dark:bg-amber-900/40 rounded-full flex items-center justify-center relative">
              <Award className="h-6 w-6 text-amber-500" />
              <div className="absolute inset-0 rounded-full border border-amber-500 pulse-glow"></div>
            </div>
          </div>
          {stats?.bestStudent && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
              {stats.bestStudent.name}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Analytics Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grade Distribution Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 animate-slide-in">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Subject Grade Distribution</h3>
            <div className="h-72 w-full">
              {stats?.gradeDistribution && stats.gradeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.gradeDistribution} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">No grades recorded yet.</div>
              )}
            </div>
          </div>

          {/* Pass/Fail Chart simulation */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 animate-slide-in" style={{ animationDelay: '50ms' }}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Academic Performance Overview</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 flex flex-col gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-500" /> Pass Rate
                    </span>
                    <span className="font-bold">{stats?.passRate || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-green-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${stats?.passRate || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <TrendingDown className="w-4 h-4 text-red-500" /> Fail Rate
                    </span>
                    <span className="font-bold">{stats?.failRate || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-red-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${stats?.failRate || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-1">Class Average</p>
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600">{stats?.classAverage || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          {/* Recent Activity Feed */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 animate-slide-in" style={{ animationDelay: '100ms' }}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ClipboardEdit className="w-5 h-5 text-gray-400" /> Recent Activity
            </h3>
            
            <div className="space-y-4">
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex gap-3 text-sm">
                    <div className="mt-1 flex flex-col items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {idx !== stats.recentActivity!.length - 1 && <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 my-1"></div>}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {activity.modifiedBy?.name || 'A teacher'}{' '}
                        <span className="font-normal text-gray-500 dark:text-gray-400">updated {activity.field} for</span>{' '}
                        {activity.assessment?.student?.firstName} {activity.assessment?.student?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {activity.assessment?.subject?.name} • {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">No recent mark changes recorded.</div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 animate-slide-in" style={{ animationDelay: '150ms' }}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <Link href="/marks" className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors group">
                <div className="h-8 w-8 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-sm mb-2 group-hover:bg-blue-100 dark:group-hover:bg-blue-800 transition-colors">
                  <ClipboardEdit className="h-4 w-4 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-center">Marks Entry</span>
              </Link>

              <Link href="/students" className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 transition-colors group">
                <div className="h-8 w-8 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-sm mb-2 group-hover:bg-purple-100 dark:group-hover:bg-purple-800 transition-colors">
                  <Users className="h-4 w-4 text-gray-600 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 text-center">Students</span>
              </Link>

              <Link href="/report-cards" className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 transition-colors group">
                <div className="h-8 w-8 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-sm mb-2 group-hover:bg-green-100 dark:group-hover:bg-green-800 transition-colors">
                  <FileText className="h-4 w-4 text-gray-600 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 text-center">Reports</span>
              </Link>

              <Link href="/results" className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600 transition-colors group">
                <div className="h-8 w-8 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-sm mb-2 group-hover:bg-amber-100 dark:group-hover:bg-amber-800 transition-colors">
                  <BarChart3 className="h-4 w-4 text-gray-600 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 text-center">Broadsheet</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
