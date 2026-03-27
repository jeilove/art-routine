'use client';

import { Habit, DayData, calcDayRate } from '@/lib/types';

interface HabitCheckListProps {
  habits: Habit[];
  dayData: DayData;
  onUpdate: (habitId: string, value: number) => void;
}

/**
 * 일간 습관 체크리스트
 * binary 타입: O/X 버튼 (0 또는 100)
 * percent 타입: 0~100% 슬라이더
 * 값 변경 즉시 onUpdate 콜백으로 Zustand 상태 업데이트
 */
export default function HabitCheckList({ habits, dayData, onUpdate }: HabitCheckListProps) {
  const totalRate = calcDayRate(habits, dayData.logs);

  return (
    <div className="w-full">
      {/* 전체 달성률 바 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs" style={{ color: '#888888' }}>오늘의 달성률</span>
          <span className="text-xs font-bold" style={{ color: '#f0c040' }}>
            {Math.round(totalRate * 100)}%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#25254a' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${totalRate * 100}%`,
              background: totalRate === 1
                ? 'linear-gradient(90deg, #c5a454, #d66d5c)'
                : 'linear-gradient(90deg, #6b8ba4, #c5a454)',
              boxShadow: totalRate === 1 ? '0 0 12px rgba(197,164,84,0.4)' : 'none',
            }}
          />
        </div>
      </div>

      {/* 습관 리스트 */}
      {habits.map((habit) => {
        const log = dayData.logs.find((l) => l.habitId === habit.id);
        const value = log?.value ?? 0;
        const isDone = value === 100;

        return (
          <div
            key={habit.id}
            className="mb-2.5 rounded-xl p-3.5 border transition-all duration-200"
            style={{
              backgroundColor: '#25254a',
              borderColor: isDone ? `${habit.color}66` : '#3a3a5c',
            }}
          >
            {/* 헤더: 컬러 도트 + 이름 */}
            <div className="flex items-center gap-3 mb-2.5">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: habit.color }}
              />
              <span className="text-sm font-bold flex-1" style={{ color: '#ffffff' }}>
                {habit.name}
              </span>
              {habit.inputType === 'percent' && (
                <span className="text-xs font-bold" style={{ color: habit.color }}>
                  {value}%
                </span>
              )}
            </div>

            {/* 컨트롤 */}
            {habit.inputType === 'binary' ? (
              <button
                onClick={() => onUpdate(habit.id, isDone ? 0 : 100)}
                className="w-full py-2 rounded-lg text-sm font-bold transition-all duration-200"
                style={{
                  backgroundColor: isDone ? `${habit.color}22` : '#161630',
                  color: isDone ? habit.color : '#888888',
                  border: `1px solid ${isDone ? `${habit.color}66` : '#3a3a5c'}`,
                }}
              >
                {isDone ? '✔ 달성 완료' : '미완료'}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={value}
                  onChange={(e) => onUpdate(habit.id, parseInt(e.target.value))}
                  className="flex-1"
                  style={{ accentColor: habit.color }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
