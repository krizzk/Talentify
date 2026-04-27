import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { LoginForm } from '@/components/auth/LoginForm';
import { Bot, Orbit, ShieldCheck, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Login | AI Job System',
};

export default async function LoginPage() {
  const cookieStore = await cookies();

  if (cookieStore.has('access_token') || cookieStore.has('refresh_token')) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <div className="hero-orb relative hidden overflow-hidden px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <div className="surface-subtle inline-flex w-fit items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700">
          <Orbit className="h-4 w-4 text-indigo-500" />
          Nova career cockpit
        </div>
        <div className="max-w-xl">
          <p className="text-sm uppercase tracking-[0.32em] text-slate-400">AI Job System</p>
          <h1 className="mt-5 text-6xl font-semibold leading-[1.02] tracking-[-0.05em] text-slate-950">
            CV Builder dengan rasa modern, simple, dan futuristik.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
            Susun profil, generate CV, dan cek ATS dalam workspace yang ringan, elegan, dan jelas fokusnya.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="surface-panel panel-hover p-5">
              <Bot className="h-8 w-8 text-indigo-500" />
              <p className="mt-4 font-semibold text-slate-950">AI generation</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">Generate CV dan tailoring dengan hasil yang rapi dan siap kirim.</p>
            </div>
            <div className="surface-panel panel-hover p-5">
              <ShieldCheck className="h-8 w-8 text-violet-500" />
              <p className="mt-4 font-semibold text-slate-950">ATS insight</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">Lihat keyword match dan rekomendasi perbaikan dalam satu panel yang bersih.</p>
            </div>
          </div>
        </div>
        <div className="surface-panel-strong max-w-md p-5">
          <div className="flex items-center gap-3">
            <div className="pulse-glow flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-950">Simple, focused, effective</p>
              <p className="text-sm text-slate-600">Tampilan lebih rapi, terang, dan mudah dipindai pengguna.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-10">
        <div className="surface-panel-strong w-full max-w-xl p-6 sm:p-8 lg:p-10">
          <div className="mb-8 space-y-3">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Sign in</p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950">Selamat datang kembali</h2>
            <p className="max-w-md text-sm leading-7 text-slate-600">
              Masuk untuk lanjut mengelola CV, ATS analysis, dan workflow karier Anda.
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
