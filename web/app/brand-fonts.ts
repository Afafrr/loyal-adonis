import { Nunito, Space_Grotesk } from 'next/font/google';

export const nunito = Nunito({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const brandOutfit = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '600', '700'],
});
