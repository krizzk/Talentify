import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { BadgeCheck, Layers3, Sparkles, Wand2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Register | AI Job System',
};

export default async function RegisterPage() {
  const cookieStore = await cookies();

  if (cookieStore.has('access_token') || cookieStore.has('refresh_token')) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.02fr_0.98fr]">
      <div className="hero-orb relative hidden overflow-hidden px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <div className="surface-subtle inline-flex w-fit items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          New member onboarding
        </div>
        <div className="max-w-xl">
          <p className="text-sm uppercase tracking-[0.32em] text-slate-400">AI Job System</p>
          <h1 className="mt-5 text-6xl font-semibold leading-[1.02] tracking-[-0.05em] text-slate-950">
            Mulai dari profil, berakhir pada kesan yang meyakinkan.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
            Setup cepat untuk masuk ke workspace CV generation, public resume, dan ATS readiness
            dengan visual yang terasa modern sejak langkah pertama.
          </p>
          <div className="mt-10 space-y-4">
            <div className="surface-panel flex items-start gap-4 p-5">
              <Layers3 className="mt-1 h-6 w-6 text-indigo-500" />
              <div>
                <p className="font-semibold text-slate-950">Structured profile engine</p>
                <p className="mt-1 text-sm leading-7 text-slate-600">Data pendidikan, pengalaman, dan skill ditata untuk output AI yang lebih relevan.</p>
              </div>
            </div>
            <div className="surface-panel flex items-start gap-4 p-5">
              <Wand2 className="mt-1 h-6 w-6 text-violet-500" />
              <div>
                <p className="font-semibold text-slate-950">Premium visual workflow</p>
                <p className="mt-1 text-sm leading-7 text-slate-600">Setiap progress dan interaksi dibuat halus, ringan, dan menyenangkan dilihat.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="surface-panel-strong max-w-md p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-950">Ready for premium plans</p>
              <p className="text-sm text-slate-600">Upgrade kapan saja untuk akses unlimited CV, tailoring, dan ATS analysis.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-10">
        <div className="surface-panel-strong w-full max-w-xl p-6 sm:p-8 lg:p-10">
          <div className="mb-8 space-y-3">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Create account</p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950">Bangun akun baru</h2>
            <p className="max-w-md text-sm leading-7 text-slate-600">
              Daftar dan mulai membentuk CV yang lebih kuat, lebih bersih, dan lebih siap bersaing.
            </p>
          </div>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
