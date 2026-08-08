import type { Metadata } from 'next';
import './globals.css';
import { MediaProvider } from '@/context/MediaContext';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'My Media Feed',
  description: 'Trình phát media cá nhân & Danh sách phát',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body suppressHydrationWarning className="bg-black text-zinc-100 antialiased">
        <MediaProvider>
          <AppShell>{children}</AppShell>
        </MediaProvider>
      </body>
    </html>
  );
}
