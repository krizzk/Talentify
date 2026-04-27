'use client';

import { useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { User } from '@/types';

export function AuthBootstrap() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!user || user.role) {
      return;
    }

    let isMounted = true;

    void api
      .get<{ data: User }>('/users/me')
      .then((response) => {
        if (isMounted) {
          setUser(response.data.data);
        }
      })
      .catch(() => {
        // Leave the current session untouched if sync fails.
      });

    return () => {
      isMounted = false;
    };
  }, [setUser, user]);

  return null;
}
