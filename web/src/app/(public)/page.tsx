import { redirect } from 'next/navigation';
import { routes } from '@/lib/api/routes';

export default function HomePage() {
  redirect(routes.signIn);
}
