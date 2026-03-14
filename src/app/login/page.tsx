"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { School, Lock, Mail, AlertCircle, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loginType, setLoginType] = useState<'teacher' | 'student'>('teacher');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user?.mustChangePassword) {
      router.push('/change-password');
    }
  }, [router, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const provider = loginType === 'student' ? 'student' : 'credentials';
      const payload: any = loginType === 'student'
        ? { studentId, pin }
        : { email, password };

      const res = await signIn(provider, {
        ...payload,
        redirect: false,
      });

      if (res?.error) {
        setError(loginType === 'student' ? 'Invalid student ID or PIN' : 'Invalid email or password');
        setLoading(false);
      } else {
        router.push(loginType === 'student' ? '/student' : '/');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="max-w-md w-full relative z-10 animate-fade-in">
        {/* Logo and Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600 shadow-2xl shadow-blue-500/30 mb-8 transform hover:scale-105 transition-transform duration-300">
            <School className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Welcome Back
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-3 font-medium">
            Sign in to the School Report System
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-blue-500/5 border border-white dark:border-gray-800 p-10">
          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-slide-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Sign in as</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLoginType('teacher')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${loginType === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 shadow-sm'}`}
                >
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('student')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${loginType === 'student' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 shadow-sm'}`}
                >
                  Student
                </button>
              </div>
            </div>

            {loginType === 'teacher' ? (
              <>
                <div className="space-y-3">
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1"
                  >
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-gray-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-14 pr-6 py-4 border-2 border-transparent bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-gray-900 dark:text-white sm:text-sm transition-all duration-300 outline-none"
                      placeholder="name@school.com"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1"
                  >
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-gray-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-14 pr-6 py-4 border-2 border-transparent bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-gray-900 dark:text-white sm:text-sm transition-all duration-300 outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <label
                    htmlFor="studentId"
                    className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1"
                  >
                    Student ID
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-gray-400">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      id="studentId"
                      name="studentId"
                      type="text"
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="block w-full pl-14 pr-6 py-4 border-2 border-transparent bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-gray-900 dark:text-white sm:text-sm transition-all duration-300 outline-none"
                      placeholder="e.g. stu_abc123"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="pin"
                    className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1"
                  >
                    PIN
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-gray-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="pin"
                      name="pin"
                      type="password"
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="block w-full pl-14 pr-6 py-4 border-2 border-transparent bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-gray-900 dark:text-white sm:text-sm transition-all duration-300 outline-none"
                      placeholder="••••"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-4 px-6 rounded-2xl shadow-xl shadow-blue-500/20 text-md font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                </span>
              )}
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center space-y-1">
          <p className="text-sm text-gray-400 font-medium">🔒 Protected by Secure Encryption</p>
          <p className="text-xs text-gray-300 dark:text-gray-600">
            © {new Date().getFullYear()} Designed & Built by{' '}
            <span className="font-semibold text-gray-400">Amegah Charles Isaiah</span>
          </p>
        </div>
      </div>
    </div>
  );
}
