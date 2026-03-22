'use client';

import React, { useState } from 'react';
import { History, Search, Filter, Loader2, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterField, setFilterField] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', search, filterType, filterField],
    queryFn: async () => {
      let url = '/api/audit-logs?';
      if (search) url += `search=${search}&`;
      if (filterType) url += `actionType=${filterType}&`;
      if (filterField) url += `field=${filterField}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch logs');
      return res.json();
    }
  });

  return (
    <div className="space-y-6 animate-fade-in mb-10">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <History className="w-8 h-8 text-indigo-600" /> Administrative Audit
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Traceable history of all assessment modifications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 premium-card p-4">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Search student, subject or user..." 
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select 
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 outline-none text-sm font-bold"
        >
          <option value="">All Actions</option>
          <option value="CREATE">Initial Entry</option>
          <option value="UPDATE">Updates</option>
        </select>
        <select 
          value={filterField}
          onChange={e => setFilterField(e.target.value)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 outline-none text-sm font-bold"
        >
          <option value="">All Fields</option>
          <option value="test1">Test 1</option>
          <option value="test2">Test 2</option>
          <option value="assignment1">Assign 1</option>
          <option value="assignment2">Assign 2</option>
          <option value="examScore">Exam</option>
        </select>
      </div>

      <div className="premium-card overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Retrieving audit sequence...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-20 text-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 m-4 rounded-2xl">
            <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No historical modifications found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-slate-400">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-slate-400">Entity</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-slate-400">Modifier</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-slate-400">Modification</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-slate-400">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                        {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                      </p>
                      <span className="text-[10px] font-medium text-slate-400">{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{log.student}</p>
                      <p className="text-[10px] font-bold text-slate-400">{log.class} • {log.subject}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="font-bold text-[10px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        {log.user}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">
                          {log.field}
                        </span>
                        <div className="flex items-center gap-1.5 text-sm font-bold">
                          <span className="text-slate-400 line-through decoration-slate-300 decoration-1">{log.oldValue ?? '0'}</span>
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                          <span className="text-emerald-600">{log.newValue}</span>
                        </div>
                      </div>
                      <Badge className="mt-1 text-[9px] h-4" variant={log.action === 'CREATE' ? 'success' : 'outline'}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs italic text-slate-500 font-medium">
                      {log.reason || 'No documentation provided'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
