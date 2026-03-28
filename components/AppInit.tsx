'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from '@/lib/store';

/**
 * [v0.4.1] 앱 전역 초기화 컴포넌트
 * 비로그인(Guest) 사용자가 진입했을 때, 데이터가 아예 없는 경우 
 * 샘플 데이터를 자동으로 생성하여 서비스 컨셉을 한눈에 볼 수 있게 함.
 * Zustand 하이드레이션 완료 후에만 작동함.
 */
export default function AppInit() {
  const { status } = useSession();
  const { dailyData, initMockData, _hasHydrated } = useStore();

  const isLoading = status === 'loading';
  const isLoggedIn = status === 'authenticated';

  useEffect(() => {
    // 1. 하이드레이션(로컬 데이터 로딩) 대기
    if (!_hasHydrated) return;

    // 2. 비로그인 상태이면서 데이터(기록)가 완전이 없는 경우
    const isGuest = !isLoggedIn && !isLoading;
    const hasNoData = Object.keys(dailyData).length === 0;

    if (isGuest && hasNoData) {
      console.log("🎨 [Global AppInit] Guest detected with no data. Generating mock samples...");
      initMockData();
    }
  }, [isLoggedIn, isLoading, dailyData, initMockData, _hasHydrated]);

  return null; // UI는 렌더링하지 않음
}
