import type { ResourceProps } from '@refinedev/core';
import {
  Activity,
  LayoutDashboard,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';

export const appResources: ResourceProps[] = [
  {
    name: 'dashboard',
    list: '/dashboard',
    meta: {
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
  },
  {
    name: 'cv',
    list: '/cv/new',
    create: '/cv/new',
    show: '/cv/:id',
    meta: {
      label: 'CV Workspace',
      icon: <Sparkles className="h-5 w-5" />,
    },
  },
  {
    name: 'profile',
    list: '/profile',
    meta: {
      label: 'Profil',
      icon: <UserRound className="h-5 w-5" />,
    },
  },
  {
    name: 'settings',
    list: '/settings',
    meta: {
      label: 'Pengaturan',
      icon: <Settings className="h-5 w-5" />,
    },
  },
  {
    name: 'admin',
    list: '/admin',
    meta: {
      label: 'Admin Hub',
      icon: <Shield className="h-5 w-5" />,
      roles: ['admin'],
    },
  },
  {
    name: 'admin-users',
    list: '/admin/users',
    meta: {
      label: 'User Management',
      icon: <Users className="h-5 w-5" />,
      parent: 'admin',
      roles: ['admin'],
    },
  },
  {
    name: 'admin-moderation',
    list: '/admin/moderation',
    meta: {
      label: 'Moderation',
      icon: <ShieldAlert className="h-5 w-5" />,
      parent: 'admin',
      roles: ['admin'],
    },
  },
  {
    name: 'admin-system-health',
    list: '/admin/system-health',
    meta: {
      label: 'System Health',
      icon: <Activity className="h-5 w-5" />,
      parent: 'admin',
      roles: ['admin'],
    },
  },
];
