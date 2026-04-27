'use client';

import type { CVContent } from '@/types';

interface CVPreviewProps {
  content: CVContent;
}

export function CVPreview({ content }: CVPreviewProps) {
  if (!content) {
    return null;
  }

  return (
    <div className="surface-panel-strong max-w-4xl space-y-8 p-8 sm:p-10">
      <div className="border-b border-slate-200 pb-7 text-center">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2rem]">{content.header.full_name}</h1>
        <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-2 text-sm leading-7 text-slate-500">
          {content.header.email && <span>{content.header.email}</span>}
          {content.header.phone && (
            <>
              <span>•</span>
              <span>{content.header.phone}</span>
            </>
          )}
          {content.header.location && (
            <>
              <span>•</span>
              <span>{content.header.location}</span>
            </>
          )}
          {content.header.linkedin_url && (
            <>
              <span>•</span>
              <a
                href={content.header.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                LinkedIn
              </a>
            </>
          )}
        </div>
      </div>

      {content.professional_summary && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-950">Ringkasan Profesional</h2>
          <p className="text-[15px] leading-8 text-slate-600">{content.professional_summary}</p>
        </section>
      )}

      {content.experiences && content.experiences.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Pengalaman Kerja</h2>
          <div className="space-y-4">
            {content.experiences.map((exp, idx) => (
              <div key={idx} className="surface-subtle rounded-[22px] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold leading-7 text-slate-950">{exp.position}</p>
                    <p className="text-sm text-slate-500">{exp.company}</p>
                  </div>
                  <p className="text-sm text-slate-400">
                    {new Date(exp.start_date).toLocaleDateString('id-ID', {
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    –{' '}
                    {exp.end_date
                      ? new Date(exp.end_date).toLocaleDateString('id-ID', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Sekarang'}
                  </p>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-8 text-slate-600">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {content.education && content.education.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Pendidikan</h2>
          <div className="space-y-4">
            {content.education.map((edu, idx) => (
              <div key={idx} className="surface-subtle rounded-[22px] p-5">
                <p className="font-semibold leading-7 text-slate-950">{edu.degree}</p>
                <p className="text-sm text-slate-500">{edu.institution}</p>
                <div className="mt-2 flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:justify-between">
                  <span>{edu.field_of_study}</span>
                  <span>
                    {new Date(edu.start_date).getFullYear()} –{' '}
                    {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Sekarang'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {content.skills && content.skills.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-950">Keahlian</h2>
          <div className="flex flex-wrap gap-2.5">
            {content.skills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-sm font-medium text-indigo-700"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
