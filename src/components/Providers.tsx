'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SettingsProvider } from '@/contexts/SettingsContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,                 // Never serve stale data — always re-validate
        refetchOnWindowFocus: true,   // Re-fetch when tab is focused again
        retry: 1,                     // retry once on failure before showing error
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <SettingsProvider>
          {children}
          <Toaster position="top-right" />
        </SettingsProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
