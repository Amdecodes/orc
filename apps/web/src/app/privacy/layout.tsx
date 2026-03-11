import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Learn how National ID Formatter collects, uses, and protects your personal data. We are committed to your privacy and data security.',
  alternates: {
    canonical: 'https://nationalidformatter.app/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | National ID Formatter',
    description:
      'Learn how National ID Formatter collects, uses, and protects your personal data.',
    url: 'https://nationalidformatter.app/privacy',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
