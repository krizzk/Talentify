# 🎨 SKILL — Frontend

## AI Job Getting System — Frontend Development Guide

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · React Query · Zustand  
**Context:** Single Engineer (Phase-based cross-role execution)  
**Phase Context:** Use skills per phase as defined in 15-IMPL-INTEGRATED.md

---

## 1. Skill: Membuat Page Baru

### Kapan digunakan
Setiap kali ada route baru yang perlu dibuat sesuai struktur `app/` directory di Next.js App Router.

### Langkah-langkah

**Step 1 — Tentukan apakah halaman ini protected atau public**
```
Public  → app/(public)/nama-halaman/page.tsx
Protected → app/(protected)/nama-halaman/page.tsx
```

**Step 2 — Buat file page dengan struktur minimal**
```typescript
// app/(protected)/cv/new/page.tsx
import { Metadata } from 'next';
import { GenerateCVClient } from '@/components/cv/GenerateCVClient';

export const metadata: Metadata = {
  title: 'Generate CV | AI Job System',
};

export default function GenerateCVPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <GenerateCVClient />
    </main>
  );
}
```

**Step 3 — Pisahkan server component dan client component**
- `page.tsx` → Server Component (default, boleh async, bisa fetch data)
- Komponen dengan state/event → buat file terpisah dengan `'use client'` di baris pertama

---

## 2. Skill: Fetch Data dari API

### Setup API Client

Gunakan instance Axios yang sudah dikonfigurasi di `lib/api.ts`. Jangan pernah panggil `fetch()` langsung ke backend tanpa interceptor.

```typescript
// lib/api.ts — sudah ada auto-refresh token 401
import api from '@/lib/api';

// GET
const { data } = await api.get('/cv');

// POST
const { data } = await api.post('/cv/generate');

// PUT
const { data } = await api.put(`/cv/${id}`, payload);
```

### Fetch dengan React Query (data server)

```typescript
// hooks/use-cv.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CV } from '@/types/cv.types';

// READ
export function useCVList() {
  return useQuery<CV[]>({
    queryKey: ['cvs'],
    queryFn: () => api.get('/cv').then(r => r.data.data),
    staleTime: 2 * 60 * 1000, // 2 menit
  });
}

// WRITE
export function useGenerateCV() {
  const qc = useQueryClient();
  return useMutation<CV>({
    mutationFn: () => api.post('/cv/generate').then(r => r.data.data),
    onSuccess: (newCV) => {
      // Update cache tanpa refetch
      qc.setQueryData<CV[]>(['cvs'], (old) => [newCV, ...(old ?? [])]);
    },
    onError: (err) => {
      // Error handling terpusat di sini
    },
  });
}
```

### Pola loading / error state

```typescript
function CVListPage() {
  const { data: cvs, isLoading, isError } = useCVList();

  if (isLoading) return <CVListSkeleton />;
  if (isError) return <ErrorState message="Gagal memuat daftar CV" />;
  if (!cvs?.length) return <EmptyState />;

  return <CVList cvs={cvs} />;
}
```

---

## 3. Skill: Membuat Form

Gunakan **React Hook Form** + **Zod** untuk semua form. Jangan gunakan controlled input manual (`useState` per field).

```typescript
// components/auth/LoginForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    // Panggil mutation hook di sini
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="input-field"
        />
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
}
```

---

## 4. Skill: Multi-Step Form (Profile)

```typescript
'use client';

import { useState } from 'react';

const STEPS = ['Personal', 'Pendidikan', 'Pengalaman', 'Skill'] as const;
type Step = typeof STEPS[number];

export function ProfileForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});

  const handleNext = (stepData: object) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    if (currentStep < STEPS.length - 1) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    // Submit formData ke API PUT /profile
  };

  return (
    <div>
      {/* Progress indicator */}
      <StepIndicator steps={STEPS} current={currentStep} />

      {/* Step content */}
      {currentStep === 0 && <PersonalStep onNext={handleNext} />}
      {currentStep === 1 && <EducationStep onNext={handleNext} onBack={handleBack} />}
      {currentStep === 2 && <ExperienceStep onNext={handleNext} onBack={handleBack} />}
      {currentStep === 3 && <SkillStep onSubmit={handleSubmit} onBack={handleBack} />}
    </div>
  );
}
```

---

## 5. Skill: AI Loading State (Streaming UX)

Untuk endpoint AI yang response-nya lambat (generate, tailor), tampilkan skeleton + pesan progress agar UX tidak terasa freeze.

```typescript
'use client';

import { useState } from 'react';
import { useGenerateCV } from '@/hooks/use-cv';

const AI_MESSAGES = [
  'Membaca profil kamu...',
  'Menyusun pengalaman kerja...',
  'Mengoptimasi untuk ATS...',
  'Finishing touches...',
];

export function GenerateCVButton() {
  const { mutate: generateCV, isPending } = useGenerateCV();
  const [messageIndex, setMessageIndex] = useState(0);

  const handleGenerate = () => {
    // Rotate loading messages setiap 2.5 detik
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % AI_MESSAGES.length);
    }, 2500);

    generateCV(undefined, {
      onSettled: () => clearInterval(interval),
    });
  };

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-muted animate-pulse">
          {AI_MESSAGES[messageIndex]}
        </p>
      </div>
    );
  }

  return (
    <button onClick={handleGenerate} className="btn-primary">
      Generate CV dengan AI
    </button>
  );
}
```

---

## 6. Skill: Render ATS Score

```typescript
// components/ats/ATSScoreCard.tsx
interface ATSScoreCardProps {
  score: number;              // 0-100
  matchedKeywords: string[];
  missingKeywords: string[];
}

export function ATSScoreCard({ score, matchedKeywords, missingKeywords }: ATSScoreCardProps) {
  const color = score >= 80 ? 'green' : score >= 60 ? 'amber' : 'red';

  return (
    <div className="rounded-xl border p-6 space-y-4">
      {/* Score ring */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">ATS Score</p>
          <p className={`text-5xl font-bold text-${color}-500`}>{score}</p>
          <p className="text-xs text-muted">dari 100</p>
        </div>
        <ScoreRing score={score} color={color} />
      </div>

      {/* Keywords */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Keyword Cocok ({matchedKeywords.length})</p>
        <div className="flex flex-wrap gap-2">
          {matchedKeywords.map(k => (
            <KeywordBadge key={k} keyword={k} variant="matched" />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Keyword Kurang ({missingKeywords.length})</p>
        <div className="flex flex-wrap gap-2">
          {missingKeywords.map(k => (
            <KeywordBadge key={k} keyword={k} variant="missing" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 7. Skill: Auth Guard (Protected Routes)

```typescript
// app/(protected)/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const hasSession = cookieStore.has('refresh_token');

  if (!hasSession) redirect('/auth/login');

  return <>{children}</>;
}
```

```typescript
// Untuk client-side check (misalnya di komponen yang butuh user data)
'use client';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useRequireAuth() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace('/auth/login');
  }, [user, router]);

  return user;
}
```

---

## 8. Skill: Error Handling Terpusat

```typescript
// lib/api.ts — response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { status, data } = error.response ?? {};

    if (status === 401) {
      try {
        await api.post('/auth/refresh');
        return api.request(error.config); // Retry
      } catch {
        useAuthStore.getState().clearAuth();
        window.location.href = '/auth/login';
      }
    }

    if (status === 429) {
      toast.error('Terlalu banyak request. Coba lagi dalam beberapa menit.');
    }

    if (status === 503) {
      toast.error('AI sedang sibuk. Coba lagi dalam beberapa detik.');
    }

    return Promise.reject(error);
  }
);
```
