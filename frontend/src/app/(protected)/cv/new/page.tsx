import { GenerateCVClient } from '@/components/cv/GenerateCVClient';

export const metadata = {
  title: 'Buat CV Baru | AI Job System',
  description: 'Generate CV profesional dengan AI yang dioptimasi untuk ATS',
};

export default function GenerateCVPage() {
  return <GenerateCVClient />;
}
