import type { Metadata } from 'next';
import { inter } from './brand-fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sign in | Loyal Nest',
  description: 'Sign in to your Loyal Nest account',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='pl'>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
