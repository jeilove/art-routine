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

    // 2. 비로그인 상태이면서 데이터(기록)가 한 주기(30일)를 채우지 못한 경우 강제 초기화
    const isUnauthenticated = status === 'unauthenticated';
    const isActuallyGuest = isUnauthenticated && !isLoading;
    const hasInsufficientData = Object.keys(dailyData).length < 28;
    
    console.log(`🔍 [AppInit v0.5.0] status:${status}, dataCount:${Object.keys(dailyData).length}, isGuest:${isActuallyGuest}`);

    if (isActuallyGuest && hasInsufficientData) {
      console.log("🎨 [Global AppInit] Data incomplete (<28). Force re-seeding full 30 days for v0.5.0...");
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
