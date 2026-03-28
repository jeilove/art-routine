'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function AppInit({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const { dailyData, initMockData, _hasHydrated } = useStore();

  const isLoading = status === 'loading';
  const isLoggedIn = status === 'authenticated';

  useEffect(() => {
    // 1. 하이드레이션(로컬 데이터 로딩) 대기
    if (!_hasHydrated) return;

    // 2. 비로그인 상태이면서 데이터(기록)가 완전히 없는 경우 자동 샘플 생성
    const isGuest = !isLoggedIn && !isLoading;
    const hasNoData = Object.keys(dailyData).length === 0;

    if (isGuest && hasNoData) {
      console.log("🎨 [Global AppInit] Guest detected with no data. Generating mock samples for v0.4.4...");
      initMockData();
    }
  }, [isLoggedIn, isLoading, dailyData, initMockData, _hasHydrated]);

  // 로컬 스토리지 데이터 로딩 전에는 화려한 로딩 화면 노출 (데이터 유실 오인 방지)
  if (!_hasHydrated) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0c0c16]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <Loader2 className="w-10 h-10 text-[#c5a454] animate-spin mb-4" />
          <p className="text-[#8888aa] text-sm font-light tracking-widest animate-pulse">
            ART ROUTINE 로딩 중...
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>; 
}
