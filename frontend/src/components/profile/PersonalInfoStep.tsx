'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalInfoSchema, type PersonalInfoData } from '@/lib/schemas/profile.schemas';
import { Button } from '@/components/ui/Button';
import type { Profile } from '@/types';

interface PersonalInfoStepProps {
  defaultValues?: Partial<Profile>;
  onNext: (data: PersonalInfoData) => void;
}

export function PersonalInfoStep({ defaultValues, onNext }: PersonalInfoStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      target_role: defaultValues?.target_role ?? '',
      phone: defaultValues?.phone ?? '',
      location: defaultValues?.location ?? '',
      linkedin_url: defaultValues?.linkedin_url ?? '',
      professional_summary: defaultValues?.professional_summary ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div>
        <label className="field-label">
          Target Role <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Contoh: Backend Engineer"
          className="field-input"
          {...register('target_role')}
        />
        {errors.target_role && (
          <p className="field-error mt-1">{errors.target_role.message}</p>
        )}
      </div>

      <div>
        <label className="field-label">Nomor Telepon</label>
        <input
          type="text"
          placeholder="Contoh: +62 812 3456 7890"
          className="field-input"
          {...register('phone')}
        />
        {errors.phone && <p className="field-error mt-1">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="field-label">Lokasi</label>
        <input
          type="text"
          placeholder="Contoh: Jakarta, Indonesia"
          className="field-input"
          {...register('location')}
        />
        {errors.location && <p className="field-error mt-1">{errors.location.message}</p>}
      </div>

      <div>
        <label className="field-label">URL LinkedIn</label>
        <input
          type="text"
          placeholder="Contoh: https://linkedin.com/in/username"
          className="field-input"
          {...register('linkedin_url')}
        />
        {errors.linkedin_url && (
          <p className="field-error mt-1">{errors.linkedin_url.message}</p>
        )}
      </div>

      <div>
        <label className="field-label">
          Professional Summary <span className="text-xs text-slate-400">(Opsional)</span>
        </label>
        <textarea
          placeholder="Jelaskan pengalaman dan keahlian Anda secara singkat..."
          maxLength={500}
          rows={4}
          className="field-textarea"
          {...register('professional_summary')}
        />
        {errors.professional_summary && (
          <p className="field-error mt-1">{errors.professional_summary.message}</p>
        )}
      </div>

      <Button variant="primary" type="submit" className="mt-6 w-full">
        Lanjut ke Pendidikan
      </Button>
    </form>
  );
}
