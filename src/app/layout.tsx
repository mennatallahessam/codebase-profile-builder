import type { Metadata } from 'next';
import { Outfit, Space_Grotesk } from 'next/font/google';
import '../../styles/globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Codebase Personality Profiler',
  description: 'Analyze, roast, and visualize your GitHub repositories with AI-powered insights.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${spaceGrotesk.variable} dark`}>
      <body className="antialiased bg-[#030712] text-slate-100 min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
