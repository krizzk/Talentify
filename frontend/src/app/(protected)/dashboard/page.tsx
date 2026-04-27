import { Metadata } from 'next';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard | AI Job System',
};

export default function DashboardPage() {
  // Fetch user data server-side if needed in future
  // For now, all data is fetched client-side via React Query

  return <DashboardClient />;
}
