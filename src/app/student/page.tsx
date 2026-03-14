'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, LogOut, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function StudentPortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const studentId = (session?.user as any)?.studentId as string | undefined;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/report-card/${studentId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load report');
        }
        const data = await res.json();
        setReport(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && session && (session.user as any).role === 'STUDENT') {
      if (!studentId) {
        setError('Unable to determine your student profile. Contact your administrator.');
        setLoading(false);
        return;
      }
      load();
    }
  }, [status, session, studentId]);

  if (status === 'loading') {
    return <div className="p-12 text-center">Loading...</div>;
  }

  if (!session || (session.user as any).role !== 'STUDENT') {
    return (
      <div className="min-h-screen flex items-center justify-center p-12 bg-slate-50 dark:bg-slate-950">
        <div className="text-center max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-3xl shadow-lg">
          <Shield className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Access restricted</h1>
          <p className="mt-3 text-slate-500 dark:text-slate-400">This page is for students only. Please log in with your student credentials.</p>
          <Button className="mt-6" onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <BookOpen className="w-9 h-9 text-indigo-600" /> Student Result Portal
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">View your latest report card and progress summary.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<LogOut className="w-4 h-4" />} onClick={() => signOut({ callbackUrl: '/login' })}>Logout</Button>
          </div>
        </div>

        {loading ? (
          <div className="p-14 text-center text-slate-500">Fetching your report card...</div>
        ) : error ? (
          <div className="p-14 text-center text-rose-600 font-semibold">{error}</div>
        ) : report ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl p-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{report.school.studentLabel}</p>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  {report.student.lastName}, {report.student.firstName}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{report.student.className} • {report.term} ({report.academicYear})</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Overall Avg</span>
                <span className="text-3xl font-black text-indigo-600">{report.summary.average}%</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{report.school.subjectLabel}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{report.school.gradeLabel}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{report.school.finalTotalLabel}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report.subjects.map((subject: any) => (
                    <tr key={subject.subjectId} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white">{subject.subjectName}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{subject.grade}</td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">{subject.finalTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 flex flex-col md:flex-row justify-between gap-4">
              <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Class Position</p>
                <p className="text-2xl font-black text-indigo-600">{report.summary.position}{report.summary.positionSuffix}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Class Average</p>
                <p className="text-2xl font-black text-indigo-600">{report.summary.classAverage}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
