import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Habit,
  DailyLog,
  DayData,
  ViewMode,
  DEFAULT_HABITS,
  calcDayRate,
} from './types';


interface ArtRoutineState {
  // 설정
  habits: Habit[];
  viewMode: ViewMode;
  selectedDay: string | null; // "YYYY-MM-DD" 형태의 문자열 키
  startDate: string | null; // 루틴 시작일 (YYYY-MM-DD)
  // 기록 데이터 (key: "YYYY-MM-DD")
  dailyData: Record<string, DayData>;

  // 액션
  setHabits: (habits: Habit[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedDay: (dateStr: string | null) => void;
  setLog: (dateStr: string, habitId: string, value: number) => void;
  setDayNote: (dateStr: string, memo: string, mood: string) => void;
  getDayData: (dateStr: string) => DayData;
  getDayRate: (dateStr: string) => number;
  initMockData: () => void;
  resetData: () => void;
  // 서버 동기화 관련
  isSyncing: boolean;
  setSyncing: (val: boolean) => void;
  hydrate: (data: { habits: Habit[], dailyData: Record<string, DayData>, startDate: string | null }) => void;
  
  // 하이드레이션 상태 체크 (로컬 스토리지 로딩 완료 여부)
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
}
 
export const useStore = create<ArtRoutineState>()(
  persist(
    (set, get) => ({
      habits: DEFAULT_HABITS,
      viewMode: 'palette',
      selectedDay: null,
      startDate: null,
      dailyData: {},
      isSyncing: false,
      _hasHydrated: false,

      setHasHydrated: (val) => set({ _hasHydrated: val }),
      setSyncing: (val) => set({ isSyncing: val }),

      hydrate: (data: { habits: Habit[], dailyData: Record<string, DayData>, startDate: string | null }) => {
        // 하위 호환성: 만약 dailyData의 값이 배열이면(v0.1.x) 객체 구조(v0.2.x)로 변환
        const migratedDailyData = { ...data.dailyData };
        Object.keys(migratedDailyData).forEach(key => {
          if (Array.isArray(migratedDailyData[key])) {
            migratedDailyData[key] = {
              day: 0, 
              logs: migratedDailyData[key],
              habitSnapshot: data.habits || []
            };
          }
        });

        set({ 
          habits: data.habits && data.habits.length > 0 ? data.habits : get().habits, 
          dailyData: migratedDailyData,
          startDate: data.startDate || get().startDate,
          selectedDay: null // 복구 후 선택일 초기화
        });
      },

      setHabits: (newHabits) => {
        const { startDate, habits: oldHabits, dailyData } = get();
        const todayStr = new Date().toISOString().split('T')[0];
        const updatedDailyData = { ...dailyData };

        // 1. 루틴 시작일부터 "어제"까지의 모든 날짜를 현재 습관 목록으로 동결 시킴
        if (startDate) {
          const start = new Date(startDate);
          const today = new Date(todayStr); // 오늘 00:00:00
          
          const current = new Date(start);
          while (current < today) {
            const dateKey = current.toISOString().split('T')[0];
            const existing = updatedDailyData[dateKey] || { day: 0, logs: [] };
            
            if (!existing.habitSnapshot) {
              updatedDailyData[dateKey] = {
                ...existing,
                habitSnapshot: [...oldHabits]
              };
            }
            current.setDate(current.getDate() + 1);
          }
        }

        // 2. 중요: 오늘 및 미래의 스냅샷은 제거(Unfreeze)하거나 새로 덮어씌움
        Object.keys(updatedDailyData).forEach(dateKey => {
            if (dateKey >= todayStr) {
                const existing = updatedDailyData[dateKey];
                if (existing) {
                    delete existing.habitSnapshot;
                }
            }
        });

        const newStartDate = startDate || todayStr;
        
        set({ 
          startDate: newStartDate, 
          dailyData: updatedDailyData, 
          habits: newHabits 
        });
      },

      setViewMode: (mode) => set({ viewMode: mode }),

      setSelectedDay: (dateStr) => set({ selectedDay: dateStr }),

      setLog: (dateStr, habitId, value) => {
        const { dailyData, habits } = get();
        const existing = dailyData[dateStr] ?? { day: 0, logs: [] };
        const logs = existing.logs.filter((l) => l.habitId !== habitId);
        logs.push({ habitId, value });
        
        set({
          dailyData: {
            ...dailyData,
            [dateStr]: { 
              ...existing, 
              logs,
              habitSnapshot: existing.habitSnapshot || [...habits]
            },
          },
        });
      },

      setDayNote: (dateStr, memo, mood) => {
        const { dailyData, habits } = get();
        const existing = dailyData[dateStr] ?? { day: 0, logs: [] };
        set({
          dailyData: {
            ...dailyData,
            [dateStr]: { 
              ...existing, 
              memo, 
              mood,
              habitSnapshot: existing.habitSnapshot || [...habits]
            },
          },
        });
      },

      getDayData: (dateStr) => {
        const { dailyData } = get();
        return dailyData[dateStr] ?? { day: 0, logs: [] };
      },

      getDayRate: (dateStr) => {
        const { habits, dailyData } = get();
        const data = dailyData[dateStr];
        if (!data) return 0;
        
        const targetHabits = data.habitSnapshot || habits;
        return calcDayRate(targetHabits, data.logs);
      },

      initMockData: () => {
        const activeHabits = DEFAULT_HABITS;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 오늘 날짜를 YYYY-MM-DD 형식의 로컬 문자열로 변환 (UTC 오차 방지)
        const formatYMD = (date: Date) => {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        };

        // 정확히 31일 전을 시작일로 고정 (한 주기가 꽉 찬 상태로 시작)
        const startObj = new Date(today);
        startObj.setDate(today.getDate() - 31);
        const startStr = formatYMD(startObj);

        const mock: Record<string, DayData> = {};
        const moodOptions = ['✨', '😌', '🔥', '💤', '😗'];
        const memoOptions = ['최고의 하루!', '루틴 성공.', '조금 힘들었지만 완료.', '오늘도 성장 중.', '명화 완성 중!'];

        // 31일 전부터 오늘까지 모든 날짜를 채움
        for (let i = 0; i <= 31; i++) {
          const d = new Date(startObj);
          d.setDate(d.getDate() + i);
          const dateStr = formatYMD(d);

          if (d <= today) {
            const logs: DailyLog[] = activeHabits.map((h) => ({
              habitId: h.id,
              value: Math.random() > 0.2 ? 100 : 0,
            }));
            
            mock[dateStr] = {
              day: i + 1,
              logs,
              mood: moodOptions[Math.floor(Math.random() * moodOptions.length)],
              memo: Math.random() > 0.6 ? memoOptions[Math.floor(Math.random() * memoOptions.length)] : '',
              habitSnapshot: [...activeHabits]
            };
          }
        }
        
        set({ startDate: startStr, dailyData: mock, habits: activeHabits });
      },

      resetData: () => {
        set({ 
          startDate: new Date().toISOString().split('T')[0], 
          dailyData: {}, 
          habits: DEFAULT_HABITS,
          selectedDay: null
        });
      },
    }),
    {
      name: 'art-routine-store',
      partialize: (state) => ({
        habits: state.habits,
        dailyData: state.dailyData,
        viewMode: state.viewMode,
        startDate: state.startDate,
      }),
      onRehydrateStorage: (state) => {
        return () => {
          state.setHasHydrated(true);
        };
      },
    }
  )
);
