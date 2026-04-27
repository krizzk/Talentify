import { Metadata } from 'next';
import { ProfilePageClient } from './client';

export const metadata: Metadata = {
  title: 'Profil | AI Job System',
  description: 'Kelola profil dan data diri kamu yang akan digunakan untuk membuat CV dengan AI',
};

export default function ProfilePage() {
  return <ProfilePageClient />;
}
