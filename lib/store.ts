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
        const { habits } = get();
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 15);
        const start = thirtyDaysAgo.toISOString().split('T')[0];

        const mock: Record<string, DayData> = {};
        const moodOptions = ['✨', '😌', '🌧️', '🔥', '💤', '😗'];
        const memoOptions = [
          '오늘 하루도 뿌듯하게 마무리!',
          '비가 와서 차분하게 독서함.',
          '야근 때문에 너무 피곤하다...',
          '열정이 넘치는 하루였다.',
          '명상을 하니 마음이 편안해짐.',
          '보통의 하루, 무난했다.',
          '조금 우울했지만 운동으로 극복!',
          '내일은 더 나은 하루가 되길.',
        ];

        for (let i = 0; i < 30; i++) {
          const d = new Date(thirtyDaysAgo);
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];

          if (d <= today) {
            const logs: DailyLog[] = habits.map((h) => {
              const value =
                h.inputType === 'binary'
                  ? Math.random() > 0.35
                    ? 100
                    : 0
                  : Math.floor(Math.random() * 101);
              return { habitId: h.id, value };
            });
            mock[dateStr] = {
              day: i + 1,
              logs,
              mood: moodOptions[Math.floor(Math.random() * moodOptions.length)],
              memo: Math.random() > 0.3 ? memoOptions[Math.floor(Math.random() * memoOptions.length)] : '',
              habitSnapshot: [...habits]
            };
          }
        }
        set({ startDate: start, dailyData: mock });
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
