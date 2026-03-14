import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'premium';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900',
    secondary: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    danger: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    outline: 'border border-slate-200 text-slate-950 dark:border-slate-800 dark:text-slate-50',
    premium: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none shadow-sm'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
