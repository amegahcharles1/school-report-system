'use client';

import React, { useState } from 'react';
import { Bell, Search, Send, Mail, CheckCircle2, AlertCircle, Award, Loader2, Clock, Trash2, LayoutDashboard, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('GENERAL');

  // Queries
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', activeTab],
    queryFn: async () => {
      const res = await fetch(`/api/messages?mode=${activeTab === 'inbox' ? 'received' : 'sent'}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    }
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const res = await fetch('/api/staff');
      if (!res.ok) throw new Error('Failed to fetch staff');
      return res.json();
    },
    enabled: isAdmin && isComposeOpen
  });

  // Mutations
  const sendMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Message sent successfully!');
      setIsComposeOpen(false);
      setSubject('');
      setContent('');
      setSelectedRecipient('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  });

  const readMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  });

  const getTypeIcon = (msgType: string) => {
    switch (msgType) {
      case 'REMINDER': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'INSTRUCTION': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'QUERY': return <Search className="w-4 h-4 text-purple-500" />;
      case 'APPRECIATION': return <Award className="w-4 h-4 text-emerald-500" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTypeStyle = (msgType: string) => {
    switch (msgType) {
      case 'APPRECIATION': return 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 text-emerald-700';
      case 'REMINDER': return 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-700';
      default: return 'bg-slate-50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-800 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in mb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-indigo-600" /> Communication Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">System-wide notification and teacher support channel</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsComposeOpen(true)} variant="premium" className="shadow-lg shadow-indigo-500/20">
            <Send className="w-4 h-4" /> Broadcast / Message
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => setActiveTab('inbox')}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'inbox' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}
        >
          Inbox
        </button>
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('sent')}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'sent' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}
          >
            History (Sent)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="p-20 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
            </div>
          ) : messages.length === 0 ? (
            <div className="premium-card p-20 text-center text-slate-400">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No communications found in this channel.</p>
            </div>
          ) : (
            messages.map((msg: any) => (
              <div 
                key={msg.id} 
                onClick={() => !msg.isRead && activeTab === 'inbox' && readMutation.mutate(msg.id)}
                className={`premium-card p-6 border-l-[6px] transition-all cursor-pointer hover:shadow-xl ${msg.isRead ? 'border-slate-200 opacity-80' : 'border-indigo-600 shadow-lg shadow-indigo-500/5'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${getTypeStyle(msg.type)}`}>
                      {getTypeIcon(msg.type)}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white leading-none mb-1">
                        {msg.subject || (msg.type === 'APPRECIATION' ? 'Commendation & Appreciation' : 'Directive / Notice')}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                        From: {msg.sender.name} • {formatDistanceToNow(new Date(msg.sentAt))} ago
                      </p>
                    </div>
                  </div>
                  {!msg.isRead && activeTab === 'inbox' && (
                    <Badge variant="premium" className="text-[8px] h-4">NEW NOTICE</Badge>
                  )}
                </div>
                <div className="pl-12">
                   <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                    "{msg.content}"
                   </p>
                   {msg.type === 'APPRECIATION' && (
                     <div className="mt-4 flex items-center justify-between">
                        <Badge variant="success" className="text-[9px] h-5 bg-emerald-50 text-emerald-700 border-emerald-200">Kudus for your excellence!</Badge>
                        <Award className="w-6 h-6 text-amber-500 animate-bounce" />
                     </div>
                   )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-1">
           <div className="premium-card p-6 sticky top-24 border-t-4 border-indigo-600">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-indigo-600" /> Comm Center Status
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6 border-b pb-2">Academic Engagement Metrics</p>
              
              <div className="space-y-4">
                 <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 uppercase">Unread Directives</span>
                    <Badge variant="premium">{messages.filter((m:any) => !m.isRead && m.recipientId !== null).length}</Badge>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 uppercase">Broadcast Notices</span>
                    <Badge variant="outline">{messages.filter((m:any) => m.recipientId === null).length}</Badge>
                 </div>
                 <div className="mt-6 pt-6 border-t font-sans">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-4 leading-relaxed italic">
                      "Effective communication is the core of institutional excellence. Use this channel for academic alignment and professional appreciation."
                    </p>
                    <div className="bg-indigo-900 text-white p-4 rounded-2xl shadow-lg">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">Professional Hub</p>
                       <p className="text-sm font-bold">Secure Institutional Messaging Protocol v2.5</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <Modal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} title="Compose Professional Directive">
         <form onSubmit={(e) => { e.preventDefault(); sendMutation.mutate({ recipientId: selectedRecipient, subject, content, type }); }} className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Recipient Tier</label>
               <select 
                 value={selectedRecipient} 
                 onChange={e => setSelectedRecipient(e.target.value)}
                 className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold"
                 required
               >
                 <option value="">Select Recipient...</option>
                 <option value="all">📢 ALL TEACHERS (Broadcast)</option>
                 <optgroup label="Individual Faculty Members">
                   {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                 </optgroup>
               </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Notice Subject</label>
                 <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. End of Term Deadline" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Message Classification</label>
                 <select 
                   value={type} 
                   onChange={e => setType(e.target.value)}
                   className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold"
                 >
                   <option value="GENERAL">General Notice</option>
                   <option value="REMINDER">Deadline Reminder</option>
                   <option value="INSTRUCTION">Academic Instruction</option>
                   <option value="QUERY">Data Discrepancy Query</option>
                   <option value="APPRECIATION">Teacher Appreciation ✨</option>
                 </select>
              </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest overflow-hidden">Communication Content</label>
               <textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 min-h-[150px] outline-none transition-all"
                  placeholder="Draft your professional message here..."
                  required
               />
               <p className="text-[10px] text-slate-400 italic font-medium">Keep instructions concise and professional. Use appreciation for morale boosts.</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
               <Button type="button" variant="ghost" onClick={() => setIsComposeOpen(false)}>Discard</Button>
               <Button type="submit" variant="premium" disabled={sendMutation.isPending} icon={<Send className="w-4 h-4" />}>
                 {sendMutation.isPending ? 'Transmitting...' : 'Dispatch Message'}
               </Button>
            </div>
         </form>
      </Modal>
    </div>
  );
}
