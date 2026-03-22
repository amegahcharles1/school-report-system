'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  School,
  ClipboardEdit,
  BarChart3,
  FileText,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  Bell,
  History,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Staff', href: '/staff', icon: Shield },
  { name: 'Subjects', href: '/subjects', icon: BookOpen },
  { name: 'Classes', href: '/classes', icon: School },
  { name: 'Marks Entry', href: '/marks', icon: ClipboardEdit },
  { name: 'Results', href: '/results', icon: BarChart3 },
  { name: 'Report Cards', href: '/report-cards', icon: FileText },
  { name: 'Messages', href: '/messages', icon: Bell },
  { name: 'Audit Logs', href: '/audit-logs', icon: History, adminOnly: true },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { settings } = useSettings();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (pathname === '/login') return null;

  const role = (session?.user as any)?.role || 'TEACHER';

  const filteredNavigation = navigation.filter((item) => {
    if (item.adminOnly && role !== 'ADMIN') return false;
    if (role === 'TEACHER') {
      return !['Staff', 'Subjects', 'Classes', 'Settings'].includes(item.name);
    }
    return true;
  });

  const bottomNavItems = filteredNavigation.slice(0, 5);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        {settings.logoUrl ? (
          <img src={settings.logoUrl} alt="School Logo" className="w-10 h-10 rounded-xl object-cover flex-shrink-0 shadow-lg" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
        )}
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-sm text-gray-900 dark:text-white truncate tracking-tight">
              {settings.schoolName || 'Report Card System'}
            </h1>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              {role === 'ADMIN' ? '⚡ Admin Portal' : '📚 Teacher Portal'}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <item.icon
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                }`}
              />
              {!collapsed && <span className="font-medium">{item.name}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
        {!collapsed && (
          <div className="px-3 py-2 mb-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {(session?.user?.name || 'U')[0].toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{session?.user?.name || 'User'}</p>
              <p className="text-[10px] text-gray-400 truncate">{session?.user?.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          title={collapsed ? (darkMode ? 'Light Mode' : 'Dark Mode') : undefined}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-gray-400" />}
          {!collapsed && <span className="text-sm">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium w-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>

        {/* Copyright */}
        {!collapsed && (
          <div className="mt-2 px-3 py-2 text-center">
            <p className="text-[10px] text-gray-300 dark:text-gray-600 leading-tight">
              © {new Date().getFullYear()} Designed & Built by
            </p>
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
              Amegah Charles Isaiah
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE TOP HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 no-print">
        <div className="flex items-center gap-3">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 rounded-xl object-cover shadow-md" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="font-bold text-sm text-gray-900 dark:text-white">{settings.schoolName || 'Report Card System'}</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MOBILE DRAWER */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-[60] h-full w-72 bg-white dark:bg-gray-900 shadow-2xl transition-transform duration-300 ease-in-out no-print ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-10"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
        <SidebarContent />
      </aside>

      {/* DESKTOP SIDEBAR */}
      <aside
        className={`no-print hidden md:flex flex-shrink-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-col z-50 transition-all duration-300 ${
          collapsed ? 'w-[70px]' : 'w-[260px]'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 flex items-center justify-around px-1 py-2 no-print">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-semibold">{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-gray-400 dark:text-gray-500"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9px] font-semibold">More</span>
        </button>
      </nav>
    </>
  );
}
