import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

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
        <script
          dangerouslySetInnerHTML={{
            __html: `console.log("%c🎨 Art Routine v0.2.3 %c| Matisse Edition", "color: #c5a454; font-weight: bold; font-size: 1.2em;", "color: #888;");`,
          }}
        />
        <Providers>
          <main className="min-h-dvh max-w-[480px] mx-auto relative overflow-x-hidden">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
