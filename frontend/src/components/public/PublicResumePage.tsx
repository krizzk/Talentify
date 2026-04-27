import Link from 'next/link';
import { MailIcon, MapPinIcon, BriefcaseIcon, GraduationCapIcon, SparklesIcon, LinkIcon } from 'lucide-react';
import type { PublicResumePayload } from '@/types';

interface PublicResumePageProps {
  resume: PublicResumePayload;
}

const SECTION_LINKS = [
  { href: '#summary', label: 'Ringkasan' },
  { href: '#experience', label: 'Pengalaman' },
  { href: '#education', label: 'Pendidikan' },
  { href: '#skills', label: 'Keahlian' },
];

function formatMonthYear(value: string | null | undefined) {
  if (!value) {
    return 'Sekarang';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('id-ID', {
    month: 'short',
    year: 'numeric',
  });
}

function renderDescription(description: string) {
  return description
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function PublicResumePage({ resume }: PublicResumePageProps) {
  const { user, profile, cv } = resume;
  const summary = cv.content.professional_summary || profile.professional_summary;
  const experiences = cv.content.experiences || [];
  const education = cv.content.education || [];
  const skills = cv.content.skills || [];

  return (
    <div className="app-shell min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.10),_transparent_22%),linear-gradient(180deg,_#ffffff,_#f6f8fc)] text-slate-900">
      <div className="mx-auto flex max-w-[1360px] flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
        <aside className="border-b border-slate-200 bg-white/82 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:w-[248px] lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col gap-5 px-4 py-5 sm:px-5 lg:px-4 lg:py-4">
            <div className="surface-panel-strong hero-orb p-5">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Live Resume</p>
              <h1 className="mt-3 text-2xl font-semibold leading-tight text-slate-950">
                {cv.content.header.full_name || user.full_name}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {profile.target_role || 'Professional Talent Profile'}
              </p>

              <div className="mt-4 space-y-2.5 text-[13px] leading-6 text-slate-600">
                <div className="flex items-start gap-3">
                  <MailIcon className="mt-0.5 h-4 w-4 text-indigo-500" />
                  <span className="break-all">{cv.content.header.email || user.email}</span>
                </div>
                {cv.content.header.location && (
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="mt-0.5 h-4 w-4 text-violet-500" />
                    <span>{cv.content.header.location}</span>
                  </div>
                )}
                {profile.linkedin_url && (
                  <div className="flex items-start gap-3">
                    <LinkIcon className="mt-0.5 h-4 w-4 text-indigo-500" />
                    <Link
                      href={profile.linkedin_url}
                      target="_blank"
                      className="break-all text-indigo-600 underline decoration-indigo-300 underline-offset-4 hover:text-indigo-700"
                    >
                      LinkedIn Profile
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <nav className="grid gap-2 text-[13px] text-slate-600">
              {SECTION_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="mt-auto rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-[13px] leading-6 text-emerald-800">
              <p className="font-semibold">CV ini dibuat dari AI Job System</p>
              <p className="mt-1.5 text-emerald-700">
                Profil pengguna dirangkum otomatis menjadi landing page resume yang siap dibagikan.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 px-4 py-5 sm:px-5 lg:h-screen lg:overflow-hidden lg:px-5 lg:py-4">
          <div className="flex h-full flex-col gap-4">
            <section className="surface-panel-strong hero-orb p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Personal Landing Page</p>
                  <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.04em] text-slate-950 sm:text-[2rem]">
                    {cv.title}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                    {summary || 'Profil profesional ini menampilkan pengalaman, pendidikan, dan keahlian utama secara ringkas dan siap dibagikan.'}
                  </p>
                </div>

                <div className="surface-subtle max-w-full rounded-[22px] px-4 py-3 text-xs leading-5 text-slate-500 lg:max-w-[240px]">
                  <p className="font-semibold uppercase tracking-[0.18em] text-slate-400">URL publik</p>
                  <p className="mt-1 break-all font-medium text-indigo-600">{resume.public_url}</p>
                </div>
              </div>
            </section>

            <div className="grid flex-1 gap-4 lg:min-h-0 lg:grid-cols-[1.2fr_0.9fr]">
              <div className="grid gap-4 lg:min-h-0 lg:grid-rows-[auto_auto_1fr]">
                <section id="summary" className="surface-panel p-5">
                  <div className="flex items-center gap-2.5">
                    <SparklesIcon className="h-4.5 w-4.5 text-indigo-500" />
                    <h3 className="text-xl font-semibold text-slate-950">Ringkasan Profesional</h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {summary || 'Ringkasan profesional akan muncul di sini setelah profil pengguna dilengkapi dan CV di-generate.'}
                  </p>
                </section>

                <section id="skills" className="surface-panel p-5">
                  <div className="flex items-center gap-2.5">
                    <SparklesIcon className="h-4.5 w-4.5 text-violet-500" />
                    <h3 className="text-xl font-semibold text-slate-950">Keahlian</h3>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.length ? (
                      skills.map((skill, index) => (
                        <span
                          key={`${skill.name}-${index}`}
                          className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700"
                        >
                          {skill.name}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Belum ada skill yang dipublikasikan.</p>
                    )}
                  </div>
                </section>

                <section id="education" className="surface-panel p-5 lg:min-h-0">
                  <div className="flex items-center gap-2.5">
                    <GraduationCapIcon className="h-4.5 w-4.5 text-violet-500" />
                    <h3 className="text-xl font-semibold text-slate-950">Pendidikan</h3>
                  </div>

                  <div className="mt-3 space-y-3 lg:max-h-full lg:overflow-auto lg:pr-1">
                    {education.length ? (
                      education.map((item, index) => (
                        <article
                          key={`${item.institution}-${item.degree}-${index}`}
                          className="surface-subtle rounded-[22px] p-4"
                        >
                          <h4 className="text-base font-semibold text-slate-950">{item.degree}</h4>
                          <p className="mt-0.5 text-sm text-indigo-600">{item.institution}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            {item.field_of_study && <span>{item.field_of_study}</span>}
                            <span>
                              {formatMonthYear(item.start_date)} - {formatMonthYear(item.end_date)}
                            </span>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Belum ada data pendidikan yang dipublikasikan.</p>
                    )}
                  </div>
                </section>
              </div>

              <section id="experience" className="surface-panel p-5 lg:min-h-0">
                <div className="flex items-center gap-2.5">
                  <BriefcaseIcon className="h-4.5 w-4.5 text-indigo-500" />
                  <h3 className="text-xl font-semibold text-slate-950">Pengalaman</h3>
                </div>

                <div className="mt-3 space-y-3 lg:max-h-full lg:overflow-auto lg:pr-1">
                  {experiences.length ? (
                    experiences.map((experience, index) => (
                      <article
                        key={`${experience.company}-${experience.position}-${index}`}
                        className="surface-subtle rounded-[22px] p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4 className="text-base font-semibold text-slate-950">{experience.position}</h4>
                            <p className="mt-0.5 text-sm text-indigo-600">{experience.company}</p>
                          </div>
                          <p className="text-xs text-slate-500">
                            {formatMonthYear(experience.start_date)} - {formatMonthYear(experience.end_date)}
                          </p>
                        </div>

                        <div className="mt-3 space-y-1.5 text-sm leading-6 text-slate-600">
                          {renderDescription(experience.description || '').length ? (
                            renderDescription(experience.description || '').map((line, lineIndex) => (
                              <p key={lineIndex}>{line}</p>
                            ))
                          ) : (
                            <p>Pengalaman kerja telah dirangkum oleh engine AI berdasarkan profil pengguna.</p>
                          )}
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Belum ada pengalaman kerja yang dipublikasikan.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
