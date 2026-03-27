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
  // 서버 동기화 관련
  isSyncing: boolean;
  setSyncing: (val: boolean) => void;
  hydrate: (data: { habits: Habit[], dailyData: Record<string, DayData>, startDate: string | null }) => void;
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

      setSyncing: (val) => set({ isSyncing: val }),

      hydrate: (data) => set({ 
        habits: data.habits.length > 0 ? data.habits : get().habits, 
        dailyData: data.dailyData,
        startDate: data.startDate || get().startDate
      }),

      setHabits: (newHabits) => {
// ... (동일 로직 생략을 위해 실제 수정 시에는 전체 포함)
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
        // 그래야 사용자가 오늘 바꾼 습관 목록이 즉시 오늘 화면에 반영됨
        Object.keys(updatedDailyData).forEach(dateKey => {
            if (dateKey >= todayStr) {
                // 오늘 이후 데이터가 있으면 스냅샷 제거 (새로운 global habits을 따르도록 함)
                const existing = updatedDailyData[dateKey];
                if (existing) {
                    delete existing.habitSnapshot;
                }
            }
        });

        // 3. 루틴 시작일이 아직 없으면 오늘 날짜로 설정
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
              // 기록 시점의 전체 습관 목록을 스냅샷으로 저장 (나중에 습관이 바뀌어도 이 날의 시각화는 유지)
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
        
        // 해당 날짜의 스냅샷이 있으면 그것을 기준으로, 없으면 현재 습관 목록을 기준으로 계산
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
              habitSnapshot: [...habits] // 초기 생성 시점의 습관 목록 박제
            };
          }
        }
        set({ startDate: start, dailyData: mock });
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
    }
  )
);
