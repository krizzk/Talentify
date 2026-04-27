'use client';

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { skillsSchema, type SkillData } from '@/lib/schemas/profile.schemas';
import { Button } from '@/components/ui/Button';
import { TrashIcon, PlusIcon } from 'lucide-react';
import type { Profile } from '@/types';

interface SkillsStepProps {
  defaultValues?: Partial<Profile>;
  onNext: (data: SkillData[]) => void;
  onBack: () => void;
}

export function SkillsStep({ defaultValues, onNext, onBack }: SkillsStepProps) {
  const [skillInput, setSkillInput] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors: formErrors },
    getValues,
  } = useForm<{ skills: SkillData[] }>({
    resolver: zodResolver(z.object({ skills: skillsSchema })),
    defaultValues: {
      skills:
        defaultValues?.skills?.map((skill: any) => ({
          name: skill.name ?? '',
          category: skill.category ?? 'hard_skill',
          level: skill.level ?? 'intermediate',
        })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'skills',
  });

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      append({
        name: skillInput.trim(),
        category: 'hard_skill',
        level: 'intermediate',
      });
      setSkillInput('');
    }
  };

  const handleFormSubmit = (data: { skills: SkillData[] }) => {
    if (data.skills.length === 0) {
      alert('Minimal ada 1 skill');
      return;
    }
    onNext(data.skills);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hard_skill':
        return 'border-blue-200 bg-blue-50 text-blue-700';
      case 'soft_skill':
        return 'border-violet-200 bg-violet-50 text-violet-700';
      case 'tool':
        return 'border-slate-200 bg-slate-50 text-slate-700';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-700';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'hard_skill':
        return 'Hard Skill';
      case 'soft_skill':
        return 'Soft Skill';
      case 'tool':
        return 'Tools/Tech';
      default:
        return category;
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-3">
        <label className="field-label">
          Tambah Skill <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Contoh: TypeScript, React, Node.js"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill();
              }
            }}
            className="field-input flex-1"
          />
          <Button variant="secondary" type="button" onClick={handleAddSkill}>
            <PlusIcon className="w-4 h-4" />
          </Button>
        </div>
        <p className="field-help">Tekan Enter atau klik tombol + untuk menambah skill</p>
      </div>

      {fields.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-slate-950">Skills yang Ditambahkan</h4>

          {fields.map((field, idx) => (
            <div key={field.id} className="surface-subtle space-y-4 rounded-[24px] p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="font-medium text-slate-950">{getValues(`skills.${idx}.name`)}</p>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryColor(getValues(`skills.${idx}.category`))}`}>
                    {getCategoryLabel(getValues(`skills.${idx}.category`))}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="text-rose-500 hover:text-rose-600"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="field-select"
                    {...register(`skills.${idx}.category`)}
                  >
                    <option value="hard_skill">Hard Skill</option>
                    <option value="soft_skill">Soft Skill</option>
                    <option value="tool">Tools/Technology</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">
                    Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="field-select"
                    {...register(`skills.${idx}.level`)}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {formErrors.skills && (
        <p className="field-error">{formErrors.skills.message}</p>
      )}

      <div className="mt-8 flex gap-4">
        <Button variant="ghost" onClick={onBack} className="flex-1">
          Kembali
        </Button>
        <Button variant="primary" type="submit" className="flex-1">
          Selesai & Simpan
        </Button>
      </div>
    </form>
  );
}
