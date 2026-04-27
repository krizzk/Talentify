'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import api from '@/lib/api';
import { Reveal } from '@/components/ui/Reveal';

const PLANS = [
  { id: 'free', name: 'Free', price: 'Rp 0', features: ['1 CV per hari', '1 ATS analisis per hari', 'Basic support'] },
  { id: 'premium', name: 'Premium', price: 'Rp 99.000/bulan', features: ['Unlimited CV', 'Unlimited ATS analisis', 'CV tailoring', 'PDF export', 'Priority support'] },
  { id: 'enterprise', name: 'Enterprise', price: 'Hubungi sales', features: ['Semua fitur Premium', 'API access', 'Custom integrasi', 'Dedicated support'] },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async (planId: string) => {
    if (!user || planId === user.plan) return;
    if (planId === 'enterprise') {
      alert('Hubungi tim sales untuk enterprise: sales@aijob.com');
      return;
    }

    setUpgrading(true);
    try {
      await api.post('/users/upgrade', { plan: planId });
      window.location.reload();
    } catch (err) {
      alert('Gagal upgrade plan');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="page-shell max-w-7xl">
      <Reveal className="surface-panel-strong hero-orb mb-4 overflow-hidden p-4 sm:p-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Settings Center</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-3xl">Pengaturan Workspace</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Kelola akun, identitas pengguna, dan jalur upgrade plan dalam tampilan yang lebih
              ringkas dan mudah dipindai.
            </p>
          </div>
          <div className="surface-subtle rounded-[20px] px-4 py-3 text-sm text-slate-600">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Current Plan</p>
            <p className="mt-1 text-base font-semibold text-slate-950">{user?.plan?.toUpperCase()}</p>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <Reveal className="surface-panel p-4">
          <h2 className="mb-3 text-base font-semibold text-slate-950">Akun</h2>
          <div className="space-y-3">
            <div className="surface-subtle rounded-[20px] p-3.5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Email</p>
              <p className="mt-1.5 text-sm font-medium text-slate-900">{user?.email}</p>
            </div>
            <div className="surface-subtle rounded-[20px] p-3.5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Nama</p>
              <p className="mt-1.5 text-sm font-medium text-slate-900">{user?.full_name}</p>
            </div>
            <div className="surface-subtle rounded-[20px] p-3.5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Role</p>
              <p className="mt-1.5 text-sm font-medium uppercase text-slate-900">{user?.role}</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={90} className="surface-panel-strong p-4">
          <h2 className="mb-3 text-base font-semibold text-slate-950">Upgrade Plan</h2>
          <div className="grid items-start gap-3 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`border p-4 ${
                  user?.plan === plan.id
                    ? 'rounded-[24px] border-indigo-200 bg-[linear-gradient(180deg,rgba(238,242,255,0.95),rgba(224,231,255,0.82))] shadow-[0_14px_30px_rgba(79,70,229,0.12)]'
                    : 'surface-subtle rounded-[24px] border-slate-200'
                }`}
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Plan</p>
                <h3 className="mt-2 font-semibold text-slate-950">{plan.name}</h3>
                <p className="my-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">{plan.price}</p>
                <ul className="mb-4 space-y-1.5 text-[13px] leading-6">
                  {plan.features.map((f) => (
                    <li key={f} className="text-slate-600">• {f}</li>
                  ))}
                </ul>
                <Button
                  variant={user?.plan === plan.id ? 'secondary' : 'primary'}
                  size="sm"
                  className="w-full"
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={upgrading || user?.plan === plan.id}
                >
                  {upgrading ? <Spinner size="sm" /> : user?.plan === plan.id ? 'Aktif' : 'Pilih'}
                </Button>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
