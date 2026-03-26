'use client'

import { useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useStore } from "@/lib/store"
import { fetchUserData, syncHabits, syncDailyData } from "@/lib/actions"

export function useSync() {
  const { data: session, status } = useSession();
  const { habits, dailyData, startDate, hydrate, setSyncing } = useStore();

  const sync = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    setSyncing(true);
    try {
        // 1. 서버에서 데이터 가져오기
        const serverData = await fetchUserData();
        
        if (serverData && (serverData.habits.length > 0 || Object.keys(serverData.dailyData).length > 0)) {
            // 서버에 데이터가 있으면 하이드레이션
            hydrate({
                habits: serverData.habits,
                dailyData: serverData.dailyData,
                startDate: serverData.startDate || null,
            });
        } else {
            // 서버에 데이터가 없고 로컬에 데이터가 있으면 서버로 푸시 (초기 마이그레이션)
            if (habits.length > 0) {
                await syncHabits(habits, startDate);
            }
            for (const dateStr of Object.keys(dailyData)) {
                await syncDailyData(dateStr, dailyData[dateStr]);
            }
        }
    } catch (err) {
        console.error("Sync error:", err);
    } finally {
        setSyncing(false);
    }
  }, [status, session, habits, dailyData, hydrate, setSyncing]);

  useEffect(() => {
    if (status === 'authenticated') {
        sync();
    }
  }, [status]);

  return { sync };
}
