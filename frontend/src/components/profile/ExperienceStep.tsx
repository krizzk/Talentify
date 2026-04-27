'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { experiencesSchema, type ExperienceData } from '@/lib/schemas/profile.schemas';
import { Button } from '@/components/ui/Button';
import { TrashIcon, PlusIcon } from 'lucide-react';
import type { Profile } from '@/types';

interface ExperienceStepProps {
  defaultValues?: Partial<Profile>;
  onNext: (data: ExperienceData[]) => void;
  onBack: () => void;
}

export function ExperienceStep({ defaultValues, onNext, onBack }: ExperienceStepProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors: formErrors },
  } = useForm<{ experiences: ExperienceData[] }>({
    resolver: zodResolver(z.object({ experiences: experiencesSchema })),
    defaultValues: {
      experiences:
        defaultValues?.experiences?.map((exp: any) => ({
          company: exp.company ?? '',
          position: exp.position ?? '',
          start_date: exp.start_date?.split('T')[0] ?? '',
          end_date: exp.end_date?.split('T')[0] ?? '',
          is_current: !exp.end_date,
          description: exp.description ?? '',
        })) ?? [
          {
            company: '',
            position: '',
            start_date: '',
            end_date: '',
            is_current: false,
            description: '',
          },
        ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'experiences',
  });

  const isCurrent = watch('experiences');

  const handleFormSubmit = (data: { experiences: ExperienceData[] }) => {
    // Filter out end_date if is_current is true
    const experiences = data.experiences.map((exp) => ({
      ...exp,
      end_date: exp.is_current ? '' : exp.end_date,
    }));
    onNext(experiences);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {fields.map((field, idx) => (
        <div key={field.id} className="surface-subtle space-y-4 rounded-[24px] p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-medium text-slate-950">Pengalaman Kerja #{idx + 1}</h4>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-rose-500 hover:text-rose-600"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <div>
            <label className="field-label">
              Perusahaan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Tokopedia"
              className="field-input"
              {...register(`experiences.${idx}.company`)}
            />
            {formErrors.experiences?.[idx]?.company && (
              <p className="field-error mt-1">
                {formErrors.experiences[idx]?.company?.message}
              </p>
            )}
          </div>

          <div>
            <label className="field-label">
              Posisi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Software Engineer"
              className="field-input"
              {...register(`experiences.${idx}.position`)}
            />
            {formErrors.experiences?.[idx]?.position && (
              <p className="field-error mt-1">
                {formErrors.experiences[idx]?.position?.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">
                Tanggal Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="field-input"
                {...register(`experiences.${idx}.start_date`)}
              />
              {formErrors.experiences?.[idx]?.start_date && (
                <p className="field-error mt-1">
                  {formErrors.experiences[idx]?.start_date?.message}
                </p>
              )}
            </div>

            <div>
              <label className="field-label">
                Tanggal Selesai
              </label>
              <input
                type="date"
                disabled={isCurrent[idx]?.is_current}
                className="field-input"
                {...register(`experiences.${idx}.end_date`)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="field-checkbox"
              {...register(`experiences.${idx}.is_current`)}
            />
            <span className="text-sm text-slate-600">Masih bekerja di sini</span>
          </label>

          <div>
            <label className="field-label">
              Deskripsi <span className="text-xs text-slate-400">(Opsional)</span>
            </label>
            <textarea
              placeholder="Jelaskan tanggung jawab dan pencapaian Anda di posisi ini..."
              maxLength={2000}
              rows={4}
              className="field-textarea"
              {...register(`experiences.${idx}.description`)}
            />
            {formErrors.experiences?.[idx]?.description && (
              <p className="field-error mt-1">
                {formErrors.experiences[idx]?.description?.message}
              </p>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          append({
            company: '',
            position: '',
            start_date: '',
            end_date: '',
            is_current: false,
            description: '',
          })
        }
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-indigo-600 shadow-[0_12px_24px_rgba(15,23,42,0.06)] backdrop-blur hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
      >
        <PlusIcon className="w-4 h-4" />
        Tambah Pengalaman
      </button>

      <div className="mt-8 flex gap-4">
        <Button variant="ghost" onClick={onBack} className="flex-1">
          Kembali
        </Button>
        <Button variant="primary" type="submit" className="flex-1">
          Lanjut ke Skill
        </Button>
      </div>
    </form>
  );
}
