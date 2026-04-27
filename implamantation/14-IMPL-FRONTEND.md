# 🎨 IMPLEMENTATION PLAN — Frontend

> ⚠️ **DEPRECATED** — This document uses the old 3-role structure (Frontend Engineer role-based).  
> **NEW UNIFIED ROADMAP:** See `15-IMPL-INTEGRATED.md` for single-engineer, phase-based execution.  
> This file kept for reference only. For current development, follow `15-IMPL-INTEGRATED.md`.

## AI Job Getting System — Frontend Roadmap (10 Phases)

**Role:** Frontend Engineer  
**Timeline:** 5 minggu  
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · React Query · Zustand · React Hook Form + Zod

---

## Overview Timeline

```
Week 1                    Week 2                  Week 3                  Week 4                  Week 5
│                         │                       │                       │                       │
├─ Phase 1                ├─ Phase 4              ├─ Phase 6              ├─ Phase 8              ├─ Phase 10
│  Project Bootstrap      │  CV Generator          │  ATS Analyzer          │  PDF Export           │  Polish &
│  & Design System        │  Page                  │  Page                  │  + Diff View          │  Go-Live
│                         │                       │                       │                       │
├─ Phase 2                ├─ Phase 5              ├─ Phase 7              ├─ Phase 9
│  Auth Pages             │  Profile Form          │  CV Editor             │  Monetization
│  (Login/Register)       │  (Multi-Step)          │  (Inline Edit)         │  UI
│                         │                       │                       │
├─ Phase 3
│  Dashboard &
│  Navigation
```

---

## Phase 1 — Project Bootstrap & Design System

**Tujuan:** Proyek Next.js berjalan dengan setup yang benar, design system dasar siap dipakai semua engineer.  
**Deliverable:** Next.js app berjalan, komponen UI dasar (Button, Input, Card, Badge), API client terkonfigurasi

### Tasks

**1.1 — Inisialisasi project**
```bash
cd apps/frontend
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# Install dependencies
npm install \
  @tanstack/react-query axios \
  zustand \
  react-hook-form @hookform/resolvers zod \
  sonner \
  class-variance-authority clsx tailwind-merge \
  lucide-react
```

**1.2 — Konfigurasi `next.config.ts`**
```typescript
const nextConfig = {
  output: 'standalone',              // Untuk Docker production
  images: {
    domains: [],
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
};
```

**1.3 — Setup API client (`src/lib/api.ts`)**

Implementasikan Axios instance dengan:
- `baseURL` dari `NEXT_PUBLIC_API_URL`
- Request interceptor: attach `Authorization: Bearer {token}` dari Zustand store
- Response interceptor: auto-refresh token jika 401, redirect ke login jika refresh gagal
- Error handling terpusat: toast 429 dan 503

**1.4 — Setup React Query provider**
```typescript
// src/app/providers.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 60 * 1000 },
      mutations: { retry: 0 },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
```

**1.5 — Auth store (Zustand)**
```typescript
// src/store/auth.store.ts
interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
}));
```

**1.6 — Komponen UI dasar**

Buat komponen berikut di `src/components/ui/`:

```typescript
// Button.tsx — dengan variant: primary, secondary, ghost, danger
// Input.tsx — dengan label, error message, helper text
// Card.tsx — container dengan border dan shadow
// Badge.tsx — dengan variant: matched (green), missing (red), neutral (gray)
// LoadingSkeleton.tsx — skeleton placeholder untuk loading state
// Spinner.tsx — loading spinner
// ErrorState.tsx — generic error UI
// EmptyState.tsx — empty list UI
```

**1.7 — Helper utilities**
```typescript
// src/lib/utils.ts
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric', month: 'long'
  }).format(new Date(date));
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}
```

### Definition of Done
- [ ] `npm run dev` berjalan tanpa error
- [ ] `npm run build` berhasil (tidak ada TypeScript error)
- [ ] Semua komponen UI bisa di-render tanpa error
- [ ] API client berhasil request ke backend (test dengan Postman atau curl)
- [ ] Zustand store bisa set dan clear auth

---

## Phase 2 — Auth Pages (Login & Register)

**Tujuan:** User bisa register akun baru dan login, dengan validasi yang baik dan UX yang smooth.  
**Deliverable:** Halaman `/auth/login` dan `/auth/register` yang berfungsi penuh

### Tasks

**2.1 — Zod schemas**
```typescript
// src/lib/schemas/auth.schemas.ts
export const registerSchema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter').max(255),
  email: z.string().email('Format email tidak valid'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[a-zA-Z]/, 'Password harus mengandung huruf')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: 'Password tidak sama',
  path: ['confirm_password'],
});

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});
```

**2.2 — Auth hooks**
```typescript
// src/hooks/use-auth.ts
export function useLogin() {
  const setAuth = useAuthStore(s => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginFormData) =>
      api.post('/auth/login', data).then(r => r.data.data),
    onSuccess: ({ access_token, user }) => {
      setAuth(access_token, user);
      toast.success(`Selamat datang, ${user.full_name}!`);
      router.push('/dashboard');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error?.message ?? 'Login gagal';
      toast.error(msg);
    },
  });
}

export function useRegister() {
  // Mirip useLogin — setelah sukses langsung setAuth dan redirect
}
```

**2.3 — Register page**

Buat form dengan field: nama lengkap, email, password, konfirmasi password. Tampilkan:
- Loading state di tombol saat submit
- Pesan error per field dari Zod
- Toast sukses atau error dari server
- Link ke halaman login

**2.4 — Login page**

Buat form dengan field: email, password. Tampilkan:
- Loading state di tombol saat submit
- Error message dari server (kredensial salah)
- Link ke halaman register
- "Lupa password?" placeholder (belum fungsional di MVP)

**2.5 — Redirect jika sudah login**
```typescript
// Jika user sudah login dan coba akses /auth/login atau /auth/register
// → redirect ke /dashboard
export default async function AuthLayout({ children }) {
  const cookieStore = cookies();
  if (cookieStore.has('refresh_token')) redirect('/dashboard');
  return <>{children}</>;
}
```

### Definition of Done
- [ ] Register berhasil → redirect ke dashboard dengan toast sukses
- [ ] Register gagal (email duplikat) → pesan error dari server tampil
- [ ] Register gagal (password tidak sama) → error client-side (tanpa hit API)
- [ ] Login berhasil → redirect ke dashboard
- [ ] Login gagal → pesan "Email atau password salah" tampil
- [ ] User yang sudah login tidak bisa akses halaman auth

---

## Phase 3 — Dashboard & Navigation

**Tujuan:** Layout utama aplikasi dengan navigasi, dashboard sebagai home setelah login.  
**Deliverable:** Protected layout dengan sidebar/navbar, dashboard page menampilkan list CV

### Tasks

**3.1 — Protected layout**
```typescript
// src/app/(protected)/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const hasSession = cookies().has('refresh_token');
  if (!hasSession) redirect('/auth/login');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
```

**3.2 — Sidebar navigasi**

Item navigasi:
- Dashboard (`/dashboard`) — icon home
- Buat CV (`/cv/new`) — icon plus
- Profil (`/profile`) — icon user
- Pengaturan (`/settings`) — icon settings

Mobile: bottom navigation (tidak ada sidebar).

**3.3 — Dashboard page**

Tampilkan:
- Greeting: "Halo, {nama user}!"
- Quick action: tombol "Buat CV Baru"
- List CV user (dari `useCVList` hook)
- Tiap card CV: judul, tipe (generated/tailored), status, tanggal dibuat, tombol aksi (lihat, hapus)
- Empty state jika belum ada CV: ilustrasi + CTA "Buat CV Pertama Kamu"
- Skeleton loading saat data sedang diambil

**3.4 — CV Card component**
```typescript
// src/components/cv/CVCard.tsx
interface CVCardProps {
  cv: CV;
  onDelete: (id: string) => void;
}

export function CVCard({ cv, onDelete }: CVCardProps) {
  return (
    <div className="bg-white rounded-xl border p-4 flex items-start justify-between gap-4">
      <div>
        <p className="font-medium text-gray-900">{cv.title}</p>
        <div className="flex gap-2 mt-1">
          <Badge variant={cv.type === 'tailored' ? 'matched' : 'neutral'}>
            {cv.type === 'tailored' ? 'Tailored' : 'Generated'}
          </Badge>
          <Badge variant={cv.status === 'finalized' ? 'matched' : 'neutral'}>
            {cv.status}
          </Badge>
        </div>
        <p className="text-xs text-gray-400 mt-1">{formatDate(cv.created_at)}</p>
      </div>
      <div className="flex gap-2">
        <Link href={`/cv/${cv.id}`}><Button variant="ghost" size="sm">Lihat</Button></Link>
        <Button variant="ghost" size="sm" onClick={() => onDelete(cv.id)}>Hapus</Button>
      </div>
    </div>
  );
}
```

### Definition of Done
- [ ] Protected layout redirect ke login jika tidak ada cookie
- [ ] Navigasi berfungsi di desktop (sidebar) dan mobile (bottom nav)
- [ ] Dashboard menampilkan list CV dari API
- [ ] Skeleton loading tampil saat data loading
- [ ] Empty state tampil jika belum ada CV
- [ ] Hapus CV berhasil dengan konfirmasi modal

---

## Phase 4 — CV Generator Page

**Tujuan:** User bisa generate CV baru dari profil dengan satu klik, dengan UX loading yang jelas.  
**Deliverable:** Halaman `/cv/new` dengan generate button dan CV preview setelah generate

### Tasks

**4.1 — Generate CV hook**
```typescript
// src/hooks/use-cv.ts
export function useGenerateCV() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => api.post('/cv/generate').then(r => r.data.data),
    onSuccess: (cv: CV) => {
      qc.setQueryData<CV[]>(['cvs'], old => [cv, ...(old ?? [])]);
      toast.success('CV berhasil di-generate!');
      router.push(`/cv/${cv.id}`);
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code;
      if (code === 'NOT_FOUND') {
        toast.error('Lengkapi profil kamu terlebih dahulu.');
        router.push('/profile');
      } else if (code === 'FORBIDDEN') {
        toast.error('Limit harian tercapai. Upgrade ke Premium untuk akses unlimited.');
      } else {
        toast.error('Gagal generate CV. Coba lagi.');
      }
    },
  });
}
```

**4.2 — AI Loading state component**

Tampilkan rotating messages saat AI sedang bekerja (lihat contoh di `06-SKILL-FRONTEND.md`).

Messages:
1. "Membaca profil kamu..."
2. "Menyusun pengalaman kerja..."
3. "Mengoptimasi untuk ATS..."
4. "Hampir selesai..."

**4.3 — Halaman `/cv/new`**

Konten:
- Heading: "Generate CV dengan AI"
- Penjelasan singkat: "AI akan membuat CV profesional dari profil yang kamu isi"
- Tombol "Generate CV" dengan icon magic wand
- Loading state saat proses berlangsung
- Error state jika profil belum diisi (dengan link ke profil)

**4.4 — CV Preview component**
```typescript
// src/components/cv/CVPreview.tsx
// Render CV content sebagai tampilan yang menyerupai dokumen nyata
// Struktur: Header (nama, kontak) → Summary → Experience → Education → Skills
// Styling: clean, professional, ATS-friendly (tidak ada table layout)
```

### Definition of Done
- [ ] Klik "Generate CV" → loading state muncul
- [ ] Setelah generate berhasil → redirect ke `/cv/{id}`
- [ ] Jika profil belum diisi → toast error + redirect ke `/profile`
- [ ] Jika free tier habis → toast error dengan pesan upgrade
- [ ] CV Preview merender semua section dengan baik

---

## Phase 5 — Profile Form (Multi-Step)

**Tujuan:** User bisa mengisi data profil lengkap melalui form multi-step yang guided.  
**Deliverable:** Halaman `/profile` dengan 4-step form, data tersimpan ke API

### Tasks

**5.1 — Profile hooks**
```typescript
export function useProfile() {
  return useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile').then(r => r.data.data),
    retry: (failureCount, error: any) => {
      // Jangan retry kalau 404 (profil belum diisi)
      return error.response?.status !== 404 && failureCount < 1;
    },
  });
}

export function useUpsertProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertProfileData) =>
      api.put('/profile', data).then(r => r.data.data),
    onSuccess: (profile) => {
      qc.setQueryData(['profile'], profile);
      toast.success('Profil berhasil disimpan!');
    },
  });
}
```

**5.2 — 4 step form**

Step 1 — Data Personal:
- Nama lengkap (auto-filled dari user account)
- Target role (contoh: "Backend Engineer")
- Lokasi (kota)
- No. telepon
- URL LinkedIn
- Professional summary (textarea, max 500 char)

Step 2 — Pendidikan:
- Form dinamis: bisa tambah/hapus entri
- Per entri: institusi, jenjang, jurusan, IPK, tahun mulai, tahun selesai

Step 3 — Pengalaman Kerja:
- Form dinamis: bisa tambah/hapus entri
- Per entri: perusahaan, posisi, tanggal mulai, tanggal selesai (atau "Masih bekerja"), deskripsi

Step 4 — Skill:
- Input tag/chip: tambah skill dengan Enter
- Kategorikan: Hard Skills, Soft Skills, Tools/Technologies
- Pilih level (Beginner / Intermediate / Advanced) per skill

**5.3 — Progress indicator**
```typescript
// StepIndicator.tsx
// Tampilkan progress: ● ○ ○ ○ → ● ● ○ ○ → dst
// Nama step: Personal → Pendidikan → Pengalaman → Skill
```

**5.4 — State management form**

Simpan data tiap step di state sementara. Submit ke API hanya di step terakhir.

```typescript
const [formData, setFormData] = useState<Partial<UpsertProfileData>>({});

const handleStepSubmit = (stepData: Partial<UpsertProfileData>) => {
  setFormData(prev => ({ ...prev, ...stepData }));
};

const handleFinalSubmit = async () => {
  await upsertProfile(formData as UpsertProfileData);
};
```

**5.5 — Pre-fill form jika profil sudah ada**

Jika user sudah pernah isi profil, form pre-filled dengan data yang ada.

### Definition of Done
- [ ] Step 1 → 4 bisa di-navigate maju dan mundur
- [ ] Data per step tersimpan saat pindah step
- [ ] Submit di step 4 → API dipanggil dengan semua data
- [ ] Form pre-fill jika profil sudah ada
- [ ] Dynamic field (tambah/hapus education, experience) berfungsi
- [ ] Validasi per field tampil sebelum lanjut ke step berikutnya

---

## Phase 6 — ATS Analyzer Page

**Tujuan:** User bisa paste job description, lihat ATS score, keyword gap, dan saran perbaikan.  
**Deliverable:** Halaman `/cv/:id/ats` yang fungsional

### Tasks

**6.1 — ATS hook**
```typescript
export function useAnalyzeATS() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { cv_id: string; job_description: string }) =>
      api.post('/ats/analyze', data).then(r => r.data.data),
    onSuccess: (result, variables) => {
      qc.setQueryData(['ats', variables.cv_id], result);
    },
  });
}
```

**6.2 — ATSScoreCard component**

Tampilkan:
- Score besar (0–100) dengan warna sesuai nilai
  - Merah: 0–59
  - Kuning/amber: 60–79
  - Hijau: 80–100
- Label deskriptif: "Perlu perbaikan" / "Cukup baik" / "Sangat baik"
- Progress ring atau bar

**6.3 — KeywordBadge component**
```typescript
// Dua grup badge:
// "Keyword Cocok" → badge hijau (matched)
// "Keyword Kurang" → badge merah (missing)

export function KeywordBadge({ keyword, variant }: { keyword: string; variant: 'matched' | 'missing' }) {
  return (
    <span className={cn(
      'px-2 py-1 rounded-full text-xs font-medium',
      variant === 'matched' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    )}>
      {variant === 'missing' && '+ '}{keyword}
    </span>
  );
}
```

**6.4 — SuggestionList component**

Tampilkan saran per section sebagai list card:
```
Section: Skills
"Tambahkan TypeScript dan unit testing ke daftar skill..."
```

**6.5 — Halaman `/cv/:id/ats`**

Layout:
- Kiri: textarea untuk paste JD + tombol "Analisis"
- Kanan: hasil analisis (loading skeleton saat proses)

Flow:
1. User paste JD → klik "Analisis"
2. Loading state muncul (max 5 detik sebelum timeout)
3. Hasil muncul: ATSScoreCard + keyword badges + suggestions
4. Tombol "Optimize CV" yang link ke `/cv/:id/optimize`

### Definition of Done
- [ ] Paste JD + klik "Analisis" → loading state muncul
- [ ] Hasil muncul dengan score, keyword matched/missing, dan saran
- [ ] Score berwarna sesuai nilai
- [ ] Tombol "Optimize CV" visible setelah hasil muncul
- [ ] Error state jika AI timeout

---

## Phase 7 — CV Editor (Inline Edit)

**Tujuan:** User bisa mengedit CV secara inline sebelum digunakan untuk ATS atau di-download.  
**Deliverable:** Halaman `/cv/:id` dengan CV yang bisa diedit tiap section

### Tasks

**7.1 — CV Editor state**
```typescript
// src/components/cv/CVEditor.tsx
'use client';

export function CVEditor({ initialCV }: { initialCV: CV }) {
  const [content, setContent] = useState<CVContent>(initialCV.content);
  const [isDirty, setIsDirty] = useState(false);

  const { mutate: updateCV, isPending } = useUpdateCV(initialCV.id);

  const handleChange = (section: keyof CVContent, value: any) => {
    setContent(prev => ({ ...prev, [section]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    updateCV({ content }, {
      onSuccess: () => {
        setIsDirty(false);
        toast.success('CV tersimpan');
      }
    });
  };

  return (
    <div>
      {/* Sticky save bar */}
      {isDirty && (
        <div className="sticky top-0 z-10 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-amber-700">Ada perubahan yang belum disimpan</span>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      )}

      {/* CV Sections */}
      <SummarySection value={content.summary} onChange={v => handleChange('summary', v)} />
      <ExperienceSection value={content.experiences} onChange={v => handleChange('experiences', v)} />
      <EducationSection value={content.educations} onChange={v => handleChange('educations', v)} />
      <SkillsSection value={content.skills} onChange={v => handleChange('skills', v)} />
    </div>
  );
}
```

**7.2 — Editable sections**

Setiap section CV (Summary, Experience, Education, Skills) bisa di-toggle antara:
- **View mode**: tampilkan konten dengan format yang rapi
- **Edit mode**: input/textarea untuk mengedit

**7.3 — Bullet point editor**

Untuk experience section, tiap bullet point bisa:
- Diedit inline
- Dihapus dengan tombol X
- Ditambah baru dengan tombol "+"

**7.4 — Halaman `/cv/:id`**

Layout:
- Header: judul CV + badge tipe + tombol aksi (ATS Check, Download PDF, Duplicate)
- Body: CVEditor component
- Sidebar kanan: panel aksi (ATS check, tailor for specific job)

### Definition of Done
- [ ] Klik section → masuk edit mode
- [ ] Perubahan tersimpan ke API dengan tombol Save
- [ ] Banner "Ada perubahan" muncul saat ada perubahan
- [ ] Bullet point bisa ditambah/diedit/dihapus
- [ ] Auto-save atau konfirmasi saat navigasi pergi dengan perubahan unsaved

---

## Phase 8 — CV Tailoring & PDF Export

**Tujuan:** User bisa optimize CV sesuai JD spesifik dan download hasilnya sebagai PDF.  
**Deliverable:** Halaman `/cv/:id/optimize` dengan diff view + download button

### Tasks

**8.1 — Tailor CV hook**
```typescript
export function useTailorCV(cvId: string) {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (jobDescription: string) =>
      api.post(`/cv/${cvId}/tailor`, { job_description: jobDescription }).then(r => r.data.data),
    onSuccess: (newCV: CV) => {
      qc.setQueryData<CV[]>(['cvs'], old => [newCV, ...(old ?? [])]);
      toast.success('CV berhasil di-optimize!');
      router.push(`/cv/${newCV.id}/optimize`);
    },
  });
}
```

**8.2 — CVDiffView component**

Tampilkan perubahan antara CV original dan CV tailored:
```typescript
// src/components/cv/CVDiffView.tsx
// Layout: 2 kolom
// Kiri: CV Original (dengan highlight teks yang berubah, warna merah)
// Kanan: CV Tailored (dengan highlight teks baru/berubah, warna hijau)
```

**8.3 — Download PDF**
```typescript
export function useDownloadPDF(cvId: string) {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get(`/cv/${cvId}/export/pdf`, {
        responseType: 'blob',
      });

      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `CV_${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success('PDF berhasil diunduh!'),
    onError: () => toast.error('Gagal generate PDF. Coba lagi.'),
  });
}
```

**8.4 — Halaman `/cv/:id/optimize`**

Flow:
1. Tampilkan CV yang sudah di-tailor (atau prompt untuk input JD jika belum)
2. Tampilkan diff: original vs tailored
3. Tombol "Download PDF"
4. Tombol "Analisis ATS lagi" (link ke `/cv/{id}/ats`)

### Definition of Done
- [ ] Diff view menampilkan perbedaan antara original dan tailored
- [ ] Download PDF trigger download di browser
- [ ] File PDF bisa dibuka dan terbaca dengan baik
- [ ] Loading state ada saat PDF sedang di-generate

---

## Phase 9 — Monetization UI

**Tujuan:** User free tier mendapat feedback yang jelas ketika mencapai limit, dengan CTA upgrade.  
**Deliverable:** Usage limit UI, upgrade prompt modal, plan badge di profile

### Tasks

**9.1 — Usage limit banner**
```typescript
// Tampilkan di dashboard jika user free tier
// "Kamu telah menggunakan 1/1 CV generate hari ini. Upgrade untuk akses unlimited."

export function UsageLimitBanner({ plan, usageToday }: UsageLimitBannerProps) {
  if (plan === 'premium') return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="font-medium text-amber-800">Free Tier</p>
        <p className="text-sm text-amber-600">
          {usageToday.generate}/1 CV generate hari ini · {usageToday.analyze}/1 ATS check hari ini
        </p>
      </div>
      <Button variant="primary" size="sm">Upgrade Premium</Button>
    </div>
  );
}
```

**9.2 — Upgrade prompt modal**
```typescript
// Muncul ketika user free tier mencoba generate/analyze setelah limit habis
export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 text-center space-y-4">
        <h2 className="text-xl font-bold">Limit Harian Tercapai</h2>
        <p className="text-gray-600">
          Upgrade ke Premium untuk akses unlimited CV generate, ATS check, dan tailoring.
        </p>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-purple-700">Rp 49.000 <span className="text-sm font-normal">/bulan</span></p>
          <ul className="text-sm text-left mt-2 space-y-1">
            <li>✓ Unlimited CV generation</li>
            <li>✓ Unlimited ATS check</li>
            <li>✓ Unlimited CV tailoring</li>
            <li>✓ Advanced ATS insight</li>
          </ul>
        </div>
        <Button variant="primary" className="w-full">Upgrade Sekarang</Button>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">
          Nanti saja
        </button>
      </div>
    </Modal>
  );
}
```

**9.3 — Plan badge di navbar/profile**
- Free tier: badge abu "Free"
- Premium: badge ungu/gold "Premium ✦"

### Definition of Done
- [ ] Usage limit banner tampil di dashboard untuk free user
- [ ] Modal upgrade muncul ketika limit tercapai
- [ ] Premium user tidak pernah lihat limit UI
- [ ] Plan badge tampil di navbar

---

## Phase 10 — Polish, Optimization & Go-Live

**Tujuan:** Aplikasi siap production — performa optimal, semua edge case dihandle, UI konsisten.  
**Deliverable:** Lighthouse score > 80, semua test pass, go-live checklist centang

### Tasks

**10.1 — Accessibility audit**

Checklist minimum:
- [ ] Semua form input punya `label` yang terhubung
- [ ] Semua tombol punya teks yang deskriptif (tidak hanya icon)
- [ ] Color contrast ratio memenuhi WCAG AA
- [ ] Keyboard navigation berfungsi (Tab, Enter, Escape)
- [ ] Loading state punya `aria-busy="true"`

**10.2 — Responsive audit**

Test di breakpoint:
- Mobile: 375px (iPhone SE)
- Tablet: 768px (iPad)
- Desktop: 1280px (laptop standard)

Komponen yang wajib responsif:
- Navbar (desktop: sidebar, mobile: bottom nav)
- CV Preview (scroll di mobile)
- ATS Score Card (stack vertical di mobile)
- Profile Form (full-width di mobile)

**10.3 — Error boundary**
```typescript
// src/components/ErrorBoundary.tsx
'use client';
export class ErrorBoundary extends Component<Props, State> {
  // Tangkap semua uncaught error di tree
  // Tampilkan fallback UI yang friendly
  // Log error ke console (bisa diganti dengan error reporting service)
}
```

**10.4 — Optimasi performa**
```typescript
// Lazy load halaman/komponen yang berat
const CVEditor = dynamic(() => import('@/components/cv/CVEditor'), {
  loading: () => <CVEditorSkeleton />,
  ssr: false,
});

// Preload data penting di layout
// Misalnya: user data di dashboard layout
```

**10.5 — Frontend go-live checklist**
- [ ] `npm run build` berhasil tanpa error
- [ ] `npm run lint` berhasil tanpa error
- [ ] Semua unit test pass
- [ ] Tidak ada `console.log` di kode production
- [ ] Tidak ada `any` type di TypeScript
- [ ] Semua form punya validasi client-side
- [ ] Error state ada di semua halaman
- [ ] Loading state ada di semua operasi async
- [ ] Responsive di mobile viewport (375px)
- [ ] Lighthouse Performance > 80
- [ ] Lighthouse Accessibility > 90
- [ ] Tidak ada `localStorage` untuk token
- [ ] `NEXT_PUBLIC_API_URL` terkonfigurasi untuk production

### Definition of Done
- [ ] Lighthouse report tersimpan sebagai artifact
- [ ] Semua item checklist di atas tercentang
- [ ] Manual smoke test semua user flow berhasil
- [ ] Zero error di browser console saat normal usage
