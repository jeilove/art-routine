import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import VersionLogger from '@/components/VersionLogger';

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-noto-sans-kr',
});

export const metadata: Metadata = {
  title: 'Art Routine — 마티스의 창 에디션',
  description: '나의 하루가 모여 하나의 명화가 됩니다.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={notoSansKr.variable}>
      <body className={`${notoSansKr.className} antialiased`}>
        {/* CSP 정책 충돌 없이 버전 로그를 출력하는 클라이언트 컴포넌트 */}
        <VersionLogger />
        <Providers>
          <main className="min-h-dvh max-w-[480px] mx-auto relative overflow-x-hidden">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
