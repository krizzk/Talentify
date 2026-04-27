'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepIndicator } from './StepIndicator';
import { PersonalInfoStep } from './PersonalInfoStep';
import { EducationStep } from './EducationStep';
import { ExperienceStep } from './ExperienceStep';
import { SkillsStep } from './SkillsStep';
import { useUpsertProfile } from '@/hooks/use-profile';
import { ErrorState } from '@/components/ui/ErrorState';
import { Spinner } from '@/components/ui/Spinner';
import type { Profile } from '@/types';
import { Reveal } from '@/components/ui/Reveal';
import type {
  PersonalInfoData,
  EducationData,
  ExperienceData,
  SkillData,
  ProfileFormData,
} from '@/lib/schemas/profile.schemas';

interface ProfileFormProps {
  initialData?: Profile;
}

const STEPS = ['Personal', 'Pendidikan', 'Pengalaman', 'Skill'];

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<ProfileFormData>>({});
  const { mutate: upsertProfile, isPending, isError, error, reset } = useUpsertProfile();

  const handlePersonalInfoNext = (data: PersonalInfoData) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(1);
  };

  const handleEducationNext = (data: EducationData[]) => {
    setFormData((prev) => ({ ...prev, education: data }));
    setCurrentStep(2);
  };

  const handleExperienceNext = (data: ExperienceData[]) => {
    setFormData((prev) => ({ ...prev, experiences: data }));
    setCurrentStep(3);
  };

  const handleSkillsNext = (data: SkillData[]) => {
    const finalData: ProfileFormData = {
      target_role: formData.target_role!,
      phone: formData.phone ?? '',
      location: formData.location ?? '',
      linkedin_url: formData.linkedin_url ?? '',
      professional_summary: formData.professional_summary ?? '',
      education: formData.education!,
      experiences: formData.experiences!,
      skills: data,
    };

    upsertProfile(finalData, {
      onSuccess: () => {
        router.push('/dashboard');
      },
    });
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isError) {
    const err = error as { response?: { data?: { error?: { message?: string } } } };
    const message = err?.response?.data?.error?.message ?? 'Silakan coba lagi';
    return (
      <ErrorState
        message="Gagal menyimpan profil"
        description={message}
        onRetry={() => {
          reset();
          setCurrentStep(0);
          setFormData({});
        }}
      />
    );
  }

  return (
    <div className="page-shell max-w-4xl">
      <Reveal className="surface-panel-strong p-8 sm:p-10">
        <div className="mb-12">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Profile setup</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">Lengkapi Profil Kamu</h1>
          <p className="mt-3 text-sm leading-8 text-slate-600">
            Data profil ini akan digunakan untuk membuat CV yang dipersonalisasi dengan AI.
          </p>
        </div>

        <StepIndicator currentStep={currentStep} totalSteps={STEPS.length} steps={STEPS} />

        {isPending && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <Spinner size="lg" />
            <p className="text-slate-600">Menyimpan profil...</p>
          </div>
        )}

        {!isPending && currentStep === 0 && (
          <PersonalInfoStep defaultValues={initialData} onNext={handlePersonalInfoNext} />
        )}

        {!isPending && currentStep === 1 && (
          <EducationStep
            defaultValues={initialData}
            onNext={handleEducationNext}
            onBack={handleBack}
          />
        )}

        {!isPending && currentStep === 2 && (
          <ExperienceStep
            defaultValues={initialData}
            onNext={handleExperienceNext}
            onBack={handleBack}
          />
        )}

        {!isPending && currentStep === 3 && (
          <SkillsStep
            defaultValues={initialData}
            onNext={handleSkillsNext}
            onBack={handleBack}
          />
        )}
      </Reveal>
    </div>
  );
}
