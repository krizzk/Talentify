'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { educationsSchema, type EducationData } from '@/lib/schemas/profile.schemas';
import { Button } from '@/components/ui/Button';
import { TrashIcon, PlusIcon } from 'lucide-react';
import type { Profile } from '@/types';

interface EducationStepProps {
  defaultValues?: Partial<Profile>;
  onNext: (data: EducationData[]) => void;
  onBack: () => void;
}

export function EducationStep({ defaultValues, onNext, onBack }: EducationStepProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors: formErrors },
  } = useForm<{ educations: EducationData[] }>({
    resolver: zodResolver(z.object({ educations: educationsSchema })),
    defaultValues: {
      educations:
        defaultValues?.education?.map((edu: any) => ({
          institution: edu.institution ?? '',
          degree: edu.degree ?? '',
          field_of_study: edu.field_of_study ?? '',
          start_date: edu.start_date?.split('T')[0] ?? '',
          end_date: edu.end_date?.split('T')[0] ?? '',
          gpa: edu.gpa ?? '',
        })) ?? [
          {
            institution: '',
            degree: '',
            field_of_study: '',
            start_date: '',
            end_date: '',
          },
        ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'educations',
  });

  const handleFormSubmit = (data: { educations: EducationData[] }) => {
    onNext(data.educations);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {fields.map((field, idx) => (
        <div key={field.id} className="surface-subtle space-y-4 rounded-[24px] p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-medium text-slate-950">Pendidikan #{idx + 1}</h4>
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
              Nama Institusi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Universitas Indonesia"
              className="field-input"
              {...register(`educations.${idx}.institution`)}
            />
            {formErrors.educations?.[idx]?.institution && (
              <p className="field-error mt-1">
                {formErrors.educations[idx]?.institution?.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">
                Jenjang <span className="text-red-500">*</span>
              </label>
              <select
                className="field-select"
                {...register(`educations.${idx}.degree`)}
              >
                <option value="">Pilih jenjang</option>
                <option value="SMA">SMA</option>
                <option value="D3">D3</option>
                <option value="S1">S1</option>
                <option value="S2">S2</option>
                <option value="S3">S3</option>
              </select>
              {formErrors.educations?.[idx]?.degree && (
                <p className="field-error mt-1">
                  {formErrors.educations[idx]?.degree?.message}
                </p>
              )}
            </div>

            <div>
              <label className="field-label">
                Jurusan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Teknik Informatika"
                className="field-input"
                {...register(`educations.${idx}.field_of_study`)}
              />
              {formErrors.educations?.[idx]?.field_of_study && (
                <p className="field-error mt-1">
                  {formErrors.educations[idx]?.field_of_study?.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">
                Tahun Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="field-input"
                {...register(`educations.${idx}.start_date`)}
              />
              {formErrors.educations?.[idx]?.start_date && (
                <p className="field-error mt-1">
                  {formErrors.educations[idx]?.start_date?.message}
                </p>
              )}
            </div>

            <div>
              <label className="field-label">
                Tahun Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="field-input"
                {...register(`educations.${idx}.end_date`)}
              />
              {formErrors.educations?.[idx]?.end_date && (
                <p className="field-error mt-1">
                  {formErrors.educations[idx]?.end_date?.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="field-label">
              GPA <span className="text-xs text-slate-400">(Opsional)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="4"
              placeholder="Contoh: 3.75"
              className="field-input"
              {...register(`educations.${idx}.gpa`)}
            />
            {formErrors.educations?.[idx]?.gpa && (
              <p className="field-error mt-1">{formErrors.educations[idx]?.gpa?.message}</p>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          append({
            institution: '',
            degree: '',
            field_of_study: '',
            start_date: '',
            end_date: '',
          })
        }
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-indigo-600 shadow-[0_12px_24px_rgba(15,23,42,0.06)] backdrop-blur hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
      >
        <PlusIcon className="w-4 h-4" />
        Tambah Pendidikan
      </button>

      <div className="mt-8 flex gap-4">
        <Button variant="ghost" onClick={onBack} className="flex-1">
          Kembali
        </Button>
        <Button variant="primary" type="submit" className="flex-1">
          Lanjut ke Pengalaman
        </Button>
      </div>
    </form>
  );
}
