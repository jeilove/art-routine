'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Palette, Frame, LogIn, LogOut, User } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { dailyData, startDate, initMockData } = useStore();

  const isLoading = status === 'loading';
  const isLoggedIn = status === 'authenticated';

  // [v0.3.2] 비로그인 상태에서 데이터 유실 방지 및 자동 생성 로직
  useEffect(() => {
    const isGuest = !isLoggedIn && !isLoading;
    const hasNoData = Object.keys(dailyData).length === 0;
    
    if (isGuest && hasNoData) {
      console.log("🎨 [Guest Mode] No log data found. Auto-generating sample data for v0.3.2 experience...");
      initMockData();
    }
  }, [isLoggedIn, isLoading, dailyData, initMockData]);

  const handleMenuClick = (path: string) => {
    // 비로그인 모드 허용 (단, 데이터 동기화 안됨 메시지 표시 가능)
    router.push(path);
  };

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden px-6 py-12"
      style={{ backgroundColor: '#0c0c16' }}
    >
      {/* 상단 로그인 정보 (유리창 효과) */}
      <div className="absolute top-6 right-6 z-20">
        {isLoggedIn ? (
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#d66d5c] to-[#c5a454] flex items-center justify-center overflow-hidden border border-white/20">
              {session.user?.image ? (
                <img src={session.user.image} alt="user" className="w-full h-full object-cover" />
              ) : (
                <User size={14} className="text-white" />
              )}
            </div>
            <span className="text-xs font-medium text-white/80">{session.user?.name}님</span>
            <button 
              onClick={() => signOut()}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : !isLoading && (
          <button 
            onClick={() => signIn('google')}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 hover:bg-white/20 transition-all text-sm font-bold text-white shadow-xl"
          >
            <LogIn size={16} />
            로그인
          </button>
        )}
      </div>

      {/* 배경 명화 — 10% 투명도 플로팅 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none animate-float"
        style={{
          backgroundImage: 'url(/matisse.jpg)',
          opacity: 0.07,
          filter: 'blur(2px)',
        }}
      />

      {/* 배경 그라데이션 오버레이 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(12,12,22,0.4) 0%, rgba(12,12,22,0.95) 100%)',
        }}
      />

      {/* 헤더 */}
      <motion.div
        className="relative z-10 text-center mb-16"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* 로고 아이콘 */}
        <div
          className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #d66d5c 0%, #c5a454 100%)',
            boxShadow: '0 0 30px rgba(197, 164, 84, 0.3)',
          }}
        >
          <span className="text-3xl">🖼️</span>
        </div>

        <h1
          className="text-3xl font-bold tracking-widest mb-2"
          style={{ color: '#c5a454', fontStyle: 'italic' }}
        >
          Art Routine
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: '#aaaaaa' }}>
          나의 하루가 모여
          <br />
          하나의 명화가 됩니다.
        </p>

        {!isLoggedIn && !isLoading && (
          <motion.p 
            className="mt-6 text-[10px] text-white/30 font-bold tracking-tighter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            ※ 로그인을 하지 않아도 사용이 가능합니다 (기기 전용)
          </motion.p>
        )}
      </motion.div>

      {/* 메뉴 카드 */}
      <div className="relative z-10 w-full max-w-sm flex flex-col gap-4">
        {/* 카드 1: 습관 설정 */}
        <motion.button
          onClick={() => handleMenuClick('/setup')}
          className="w-full text-left rounded-2xl p-5 border transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(214,109,92,0.15) 0%, rgba(214,109,92,0.05) 100%)',
            borderColor: 'rgba(214,109,92,0.4)',
          }}
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{
            scale: 1.02,
            borderColor: 'rgba(214,109,92,0.8)',
            boxShadow: '0 0 24px rgba(214,109,92,0.25)',
          }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(214,109,92,0.2)' }}
            >
              <Palette size={24} style={{ color: '#d66d5c' }} />
            </div>
            <div>
              <p className="font-bold text-base mb-1" style={{ color: '#e8e0ff' }}>
                나의 물감(습관) 준비하기
              </p>
              <p className="text-xs" style={{ color: '#888888' }}>
                명화를 그리기 위한 습관을 설정하세요.
              </p>
            </div>
          </div>
        </motion.button>

        {/* 카드 2: 대시보드 */}
        <motion.button
          onClick={() => handleMenuClick('/dashboard')}
          className="w-full text-left rounded-2xl p-5 border transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(197, 164, 84, 0.15) 0%, rgba(197, 164, 84, 0.05) 100%)',
            borderColor: 'rgba(197, 164, 84, 0.4)',
            opacity: isLoggedIn ? 1 : 0.7
          }}
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          whileHover={{
            scale: 1.02,
            borderColor: 'rgba(197, 164, 84, 0.8)',
            boxShadow: '0 0 24px rgba(197, 164, 84, 0.25)',
          }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(197, 164, 84, 0.15)' }}
            >
              <Frame size={24} style={{ color: '#c5a454' }} />
            </div>
            <div>
              <p className="font-bold text-base mb-1" style={{ color: '#e8e0ff' }}>
                내 삶의 캔버스 보기
              </p>
              <p className="text-xs" style={{ color: '#888888' }}>
                {isLoggedIn ? '채워진 나의 명화와 기록을 확인하세요.' : '로그인 후 나의 캔버스를 확인하세요.'}
              </p>
            </div>
          </div>
        </motion.button>
      </div>

    </div>
  );
}
