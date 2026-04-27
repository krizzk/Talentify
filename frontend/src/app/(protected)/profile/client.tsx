'use client';

import { Suspense } from 'react';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { useProfile } from '@/hooks/use-profile';
import { Skeleton, SkeletonLine, SkeletonCard } from '@/components/ui/Skeleton';

function ProfileFormContent() {
  const { data: profile, isLoading, error } = useProfile();

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
        <SkeletonLine />
        <SkeletonCard count={6} />
      </div>
    );
  }

  if (error) {
    return <ProfileForm />;
  }

  return <ProfileForm initialData={profile} />;
}

export function ProfilePageClient() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
          <SkeletonLine />
          <SkeletonCard count={6} />
        </div>
      }
    >
      <ProfileFormContent />
    </Suspense>
  );
}
