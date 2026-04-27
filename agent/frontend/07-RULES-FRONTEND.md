# 📏 RULES — Frontend

## AI Job Getting System — Frontend Standards & Constraints

**Berlaku untuk:** Semua kode di `frontend/` (handled by single engineer)  
**Context:** Enforcement per phase as defined in 15-IMPL-INTEGRATED.md  
**Enforcement:** Code tidak boleh committed jika melanggar aturan ini

---

## RULE 1 — Component Architecture

### R1.1 — Server vs Client Component
- Default semua component adalah **Server Component**
- Tambahkan `'use client'` **hanya** jika komponen menggunakan: `useState`, `useEffect`, event handlers, browser API, atau React hooks
- Jangan tambahkan `'use client'` hanya karena "aman" atau "mudah"

```typescript
// ✅ BENAR — Server Component (tidak perlu 'use client')
async function CVDetailPage({ params }: { params: { id: string } }) {
  const cv = await getCVById(params.id); // Boleh async di server component
  return <CVPreview cv={cv} />;
}

// ✅ BENAR — Client Component (butuh state)
'use client';
function CVEditor({ initialContent }: { initialContent: CVContent }) {
  const [content, setContent] = useState(initialContent);
  // ...
}

// ❌ SALAH — 'use client' tidak diperlukan
'use client';
function CVTitle({ title }: { title: string }) {
  return <h1>{title}</h1>; // Tidak ada hooks atau event handlers
}
```

### R1.2 — Ukuran Komponen
- Satu komponen maksimal **200 baris**
- Jika lebih, pecah menjadi subcomponen
- Satu file, satu tanggung jawab utama

### R1.3 — Penamaan
- Komponen React: **PascalCase** → `CVPreview`, `ATSScoreCard`
- File komponen: **PascalCase** → `CVPreview.tsx`
- Hooks: **camelCase dengan prefix `use`** → `useCV`, `useATSResult`
- Utility functions: **camelCase** → `formatDate`, `hashJD`

---

## RULE 2 — State Management

### R2.1 — Gunakan React Query untuk server state
Semua data yang berasal dari API **wajib** menggunakan `@tanstack/react-query`. Dilarang menggunakan `useState` + `useEffect` untuk fetch data.

```typescript
// ✅ BENAR
const { data: cv, isLoading } = useQuery({
  queryKey: ['cv', id],
  queryFn: () => api.get(`/cv/${id}`).then(r => r.data.data),
});

// ❌ SALAH
const [cv, setCV] = useState(null);
useEffect(() => {
  api.get(`/cv/${id}`).then(r => setCV(r.data.data));
}, [id]);
```

### R2.2 — Zustand hanya untuk client state global
Gunakan Zustand **hanya** untuk: auth state (user, accessToken), UI preferences (theme, sidebar state). Jangan simpan data dari API di Zustand — itu tugas React Query.

### R2.3 — Query key conventions
```typescript
// Format: [entity, identifier?, filter?]
['cvs']                    // List semua CV user
['cv', id]                 // CV spesifik
['ats', cvId]              // ATS results untuk CV tertentu
['profile']                // Profil user
```

---

## RULE 3 — Form Handling

### R3.1 — Wajib React Hook Form + Zod
Semua form **wajib** menggunakan `react-hook-form` dengan `zodResolver`. Dilarang controlled input manual (satu `useState` per field).

### R3.2 — Schema Zod wajib diekspor
```typescript
// ✅ BENAR — schema diekspor untuk reuse
export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

// ❌ SALAH — schema inline, tidak bisa di-reuse
const { register } = useForm({
  resolver: zodResolver(z.object({ email: z.string() }))
});
```

### R3.3 — Error message dalam Bahasa Indonesia
Semua pesan error pada form dan toast menggunakan Bahasa Indonesia.

---

## RULE 4 — Styling

### R4.1 — Tailwind CSS saja
Dilarang menggunakan inline `style={{}}` kecuali untuk nilai dinamis yang tidak bisa diekspresikan dengan Tailwind (contoh: progress bar width berdasarkan score).

```typescript
// ✅ BENAR — nilai dinamis
<div style={{ width: `${score}%` }} className="bg-green-500 h-2 rounded" />

// ❌ SALAH — bisa pakai Tailwind
<div style={{ display: 'flex', gap: '16px' }}>
```

### R4.2 — Variant dengan `cva` untuk komponen reusable
```typescript
import { cva } from 'class-variance-authority';

const badgeVariants = cva('px-2 py-1 rounded-full text-xs font-medium', {
  variants: {
    variant: {
      matched: 'bg-green-100 text-green-700',
      missing: 'bg-red-100 text-red-700',
      neutral: 'bg-gray-100 text-gray-600',
    },
  },
});
```

### R4.3 — Responsive wajib
Semua halaman harus responsif. Minimal test di breakpoint: `sm` (640px) dan `lg` (1024px).

---

## RULE 5 — TypeScript

### R5.1 — Dilarang `any`
Tidak boleh ada tipe `any` di codebase. Gunakan `unknown` jika tipe belum diketahui, lalu narrow dengan type guard.

```typescript
// ❌ SALAH
function parseCV(data: any) { ... }

// ✅ BENAR
function parseCV(data: unknown): CVContent {
  if (!isCVContent(data)) throw new Error('Invalid CV data');
  return data;
}
```

### R5.2 — Types di folder `types/`
Semua interface dan type yang digunakan di lebih dari satu file harus didefinisikan di `src/types/`:

```
types/
├── cv.types.ts       → CV, CVContent, CVType, CVStatus
├── ats.types.ts      → ATSResult, ATSAnalysis, Suggestion
├── profile.types.ts  → Profile, Education, Experience, Skill
└── auth.types.ts     → User, AuthResponse
```

### R5.3 — Selalu type response API
```typescript
// ✅ BENAR
const response = await api.get<APIResponse<CV[]>>('/cv');
const cvs = response.data.data;

// Definisi helper type
interface APIResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}
```

---

## RULE 6 — Error Handling & UX

### R6.1 — Semua async action wajib ada error state
Setiap operasi async yang diekspose ke user harus menangani: loading state, success state, dan error state.

```typescript
// ✅ BENAR
const { mutate, isPending, isError, error } = useMutation({ ... });

// ❌ SALAH — hanya happy path
const handleSubmit = async () => {
  const result = await generateCV(); // Tidak ada try/catch atau error state
  router.push(`/cv/${result.id}`);
};
```

### R6.2 — Toast untuk feedback user
Gunakan `sonner` atau `react-hot-toast` untuk notifikasi. Jangan gunakan `alert()` atau `console.log()` sebagai feedback user.

```typescript
import { toast } from 'sonner';

// Success
toast.success('CV berhasil di-generate!');

// Error
toast.error('Gagal generate CV. Coba lagi.');

// Loading
const toastId = toast.loading('Sedang generate CV...');
toast.dismiss(toastId);
```

### R6.3 — Loading skeleton, bukan spinner untuk page-level load
```typescript
// ✅ BENAR — skeleton menjaga layout
if (isLoading) return <CVListSkeleton />;

// ❌ KURANG BAIK — spinner tidak mempertahankan layout
if (isLoading) return <div className="flex justify-center"><Spinner /></div>;
```

---

## RULE 7 — Performance

### R7.1 — Lazy load komponen berat
```typescript
import dynamic from 'next/dynamic';

// CVEditor berat (Puppeteer preview, banyak state) — lazy load
const CVEditor = dynamic(() => import('@/components/cv/CVEditor'), {
  loading: () => <CVEditorSkeleton />,
});
```

### R7.2 — Optimasi image dengan `next/image`
Semua `<img>` tag diganti dengan `<Image>` dari `next/image`.

### R7.3 — Hindari re-render tidak perlu
Gunakan `useMemo` dan `useCallback` hanya ketika ada bukti re-render yang mahal (profiling), bukan secara preventif.

---

## RULE 8 — Security

### R8.1 — Dilarang simpan token di localStorage
Access token disimpan di memory (Zustand), refresh token di `httpOnly` cookie saja.

```typescript
// ❌ SALAH — localStorage bisa diakses XSS
localStorage.setItem('access_token', token);

// ✅ BENAR — in-memory store
useAuthStore.setState({ accessToken: token });
```

### R8.2 — Sanitize input sebelum render
Untuk konten yang mungkin berisi HTML (misalnya output AI), gunakan `DOMPurify` atau render sebagai plain text.

```typescript
import DOMPurify from 'dompurify';

// Jika perlu render HTML
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(aiOutput) }} />

// Lebih aman — render plain text
<p>{aiOutput}</p>
```

### R8.3 — Jangan expose API key ke client
Semua API key ada di `.env` tanpa prefix `NEXT_PUBLIC_`. Anthropic API key tidak boleh pernah ada di kode frontend.

---

## RULE 9 — Testing

### R9.1 — Unit test untuk semua custom hooks
Setiap hook di `hooks/` harus punya unit test menggunakan `@testing-library/react` + `vitest`.

### R9.2 — Test ID untuk komponen yang di-test E2E
```typescript
// Tambahkan data-testid untuk elemen yang jadi target test E2E
<button data-testid="generate-cv-btn" onClick={handleGenerate}>
  Generate CV
</button>
```

---

## RULE 10 — Git & Code Review

### R10.1 — Branch naming
```
feature/cv-generator
fix/ats-score-display
chore/update-dependencies
```

### R10.2 — Commit message
Format: `type(scope): deskripsi singkat`
```
feat(cv): add CV generate button with loading state
fix(auth): handle token refresh race condition
style(ats): improve score card responsive layout
test(hooks): add unit tests for useCV hook
```

### R10.3 — PR checklist sebelum minta review
- [ ] TypeScript tidak ada error (`tsc --noEmit`)
- [ ] Tidak ada `console.log` tertinggal
- [ ] Semua form sudah ada validasi
- [ ] Error state dan loading state sudah dihandle
- [ ] Sudah test di mobile viewport
- [ ] Tidak ada `any` type baru
