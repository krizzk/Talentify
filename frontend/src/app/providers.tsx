'use client';

import { Refine } from '@refinedev/core';
import routerProvider from '@refinedev/nextjs-router/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState } from 'react';
import { AuthBootstrap } from '@/components/auth/AuthBootstrap';
import { GoogleOAuthProviderWrapper } from '@/components/auth/GoogleOAuthProvider';
import { PWARegister } from '@/components/pwa/PWARegister';
import { authProvider } from '@/lib/refine/auth-provider';
import { refineDataProvider } from '@/lib/refine/data-provider';
import { notificationProvider } from '@/lib/refine/notification-provider';
import { appResources } from '@/lib/refine/resources';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 60 * 1000, // 1 menit
            gcTime: 5 * 60 * 1000, // 5 menit (formerly cacheTime)
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <GoogleOAuthProviderWrapper>
      <QueryClientProvider client={queryClient}>
        <Refine
          routerProvider={routerProvider}
          dataProvider={refineDataProvider}
          authProvider={authProvider}
          notificationProvider={notificationProvider}
          resources={appResources}
          options={{
            syncWithLocation: true,
            disableTelemetry: true,
            disableRouteChangeHandler: true,
            title: {
              text: 'AI Job System',
            },
          }}
        >
          <AuthBootstrap />
          <PWARegister />
          {children}
        </Refine>
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </GoogleOAuthProviderWrapper>
  );
}
