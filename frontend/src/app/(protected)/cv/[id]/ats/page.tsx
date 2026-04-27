import { Metadata } from 'next';
import { ATSAnalyzer } from '@/components/ats/ATSAnalyzer';

interface ATSPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ATSPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: 'Analisis ATS | AI Job System',
    description: 'Analisis seberapa baik CV Anda match dengan job description',
  };
}

export default async function ATSPage({ params }: ATSPageProps) {
  const { id } = await params;

  return (
    <div className="page-shell max-w-6xl">
      <div className="mx-auto max-w-5xl">
        <ATSAnalyzer cvId={id} />
      </div>
    </div>
  );
}
