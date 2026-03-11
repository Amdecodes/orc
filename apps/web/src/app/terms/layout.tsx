import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Read the Terms of Service for National ID Formatter. Understand your rights and responsibilities when using our Ethiopian digital ID formatting service.',
  alternates: {
    canonical: 'https://nationalidformatter.app/terms',
  },
  openGraph: {
    title: 'Terms of Service | National ID Formatter',
    description:
      'Read the Terms of Service for National ID Formatter.',
    url: 'https://nationalidformatter.app/terms',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
