import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicResumePage } from '@/components/public/PublicResumePage';
import { getPublicResume } from '@/lib/public-resume';

interface PublicResumeRouteProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: PublicResumeRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const resume = await getPublicResume(slug);

  if (!resume) {
    return {
      title: 'CV Not Found | AI Job System',
    };
  }

  return {
    title: `${resume.user.full_name} | AI Job System`,
    description:
      resume.profile.professional_summary ||
      `${resume.user.full_name} - ${resume.profile.target_role || 'Professional Profile'}`,
  };
}

export default async function PublicResumeRoute({
  params,
}: PublicResumeRouteProps) {
  const { slug } = await params;
  const resume = await getPublicResume(slug);

  if (!resume) {
    notFound();
  }

  return <PublicResumePage resume={resume} />;
}
