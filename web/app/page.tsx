import { redirect } from 'next/navigation';
import { routes } from './routes';

export default function HomePage() {
  redirect(routes.signIn);
}
