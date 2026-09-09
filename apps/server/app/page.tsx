import { redirect } from 'next/navigation';

import { sessionUser } from '@/lib/auth';

export default async function HomePage() {
  // Logged in → the deliverables registry; otherwise the login screen.
  redirect((await sessionUser()) ? '/deliverables' : '/login');
}
