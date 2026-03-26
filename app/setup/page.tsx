'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, Trash2, Check } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Habit, MATISSE_COLORS, InputType } from '@/lib/types';
import { syncHabits } from '@/lib/actions';

export default function SetupPage() {
  const router = useRouter();
  const { habits: savedHabits, setHabits } = useStore();
  const [habits, setLocalHabits] = useState<Habit[]>(savedHabits);
  const [saved, setSaved] = useState(false);

  const addHabit = () => {
    if (habits.length >= 8) return;
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: '',
      color: MATISSE_COLORS[habits.length % 8].value,
      inputType: 'binary',
      order: habits.length,
    };
    setLocalHabits([...habits, newHabit]);
  };

  const removeHabit = (id: string) => {
    setLocalHabits(habits.filter((h) => h.id !== id));
  };

  const updateHabit = (id: string, field: keyof Habit, value: string | InputType) => {
    setLocalHabits(habits.map((h) => (h.id === id ? { ...h, [field]: value } : h)));
  };

  const handleSave = async () => {
    const valid = habits.filter((h) => h.name.trim() !== '');
    setHabits(valid);
    
    // 클라우드 동기화 (로그인 상태일 때)
    await syncHabits(valid);
    
    setSaved(true);
    setTimeout(() => router.push('/dashboard'), 800);
  };

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ backgroundColor: '#0c0c16' }}
    >
      {/* 헤더 */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 px-5 py-4 border-b"
        style={{ backgroundColor: '#0c0c16', borderColor: '#2a2a4a' }}
      >
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl transition-colors"
          style={{ color: '#aaaaaa' }}
        >
          <ChevronLeft size={22} />
        </button>
        <div>
          <h1 className="font-bold text-base" style={{ color: '#e8e0ff' }}>
            어떤 물감으로 오늘을 칠할까요?
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#666688' }}>
            최대 8개의 습관을 설정하세요
          </p>
        </div>
        <div
          className="ml-auto text-xs px-2 py-1 rounded-lg"
          style={{ backgroundColor: '#25254a', color: '#9b7bff' }}
        >
          {habits.length}/8
        </div>
      </div>

      {/* 습관 리스트 */}
      <div className="flex-1 px-5 py-4 overflow-y-auto pb-32">
        <AnimatePresence>
          {habits.map((habit, idx) => (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
              className="mb-3 rounded-2xl p-4 border"
              style={{ backgroundColor: '#1a1a35', borderColor: '#3a3a5c' }}
            >
              {/* 습관 번호 + 삭제 버튼 */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs font-bold"
                  style={{ color: habit.color }}
                >
                  습관 {idx + 1}
                </span>
                <button
                  onClick={() => removeHabit(habit.id)}
                  className="p-1 rounded-lg transition-colors"
                  style={{ color: '#444466' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* 습관명 입력 */}
              <input
                type="text"
                value={habit.name}
                onChange={(e) => updateHabit(habit.id, 'name', e.target.value)}
                placeholder="습관 이름 (예: 명상 10분)"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none mb-3"
                style={{
                  backgroundColor: '#25254a',
                  border: '1px solid #3a3a5c',
                  color: '#e8e0ff',
                }}
              />

              {/* 기록 방식 토글 */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs" style={{ color: '#888888' }}>
                  기록 방식:
                </span>
                <div
                  className="flex rounded-lg overflow-hidden border"
                  style={{ borderColor: '#3a3a5c' }}
                >
                  {(['binary', 'percent'] as InputType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => updateHabit(habit.id, 'inputType', type)}
                      className="px-3 py-1.5 text-xs font-bold transition-all"
                      style={{
                        backgroundColor:
                          habit.inputType === type ? '#3a3a5c' : '#161630',
                        color:
                          habit.inputType === type ? '#f0c040' : '#666688',
                      }}
                    >
                      {type === 'binary' ? 'O/X 완료형' : '만족도형 %'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 컬러 선택 */}
              <div>
                <p className="text-xs mb-2" style={{ color: '#888888' }}>
                  고유 컬러:
                </p>
                <div className="flex gap-2 flex-wrap">
                  {MATISSE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => updateHabit(habit.id, 'color', c.value)}
                      className="w-7 h-7 rounded-full transition-all duration-200"
                      style={{
                        backgroundColor: c.value,
                        outline:
                          habit.color === c.value
                            ? `3px solid white`
                            : '2px solid transparent',
                        outlineOffset: '2px',
                        transform:
                          habit.color === c.value ? 'scale(1.2)' : 'scale(1)',
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 습관 추가 버튼 */}
        {habits.length < 8 && (
          <motion.button
            onClick={addHabit}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 border border-dashed transition-colors"
            style={{ borderColor: '#3a3a5c', color: '#666688' }}
            whileHover={{ borderColor: '#f0c040', color: '#f0c040' }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={18} />
            <span className="text-sm font-bold">습관 추가</span>
          </motion.button>
        )}
      </div>

      {/* 저장 버튼 */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 max-w-[480px] mx-auto"
        style={{
          background:
            'linear-gradient(to top, #0c0c16 70%, transparent)',
        }}
      >
        <motion.button
          onClick={handleSave}
          disabled={saved || habits.filter((h) => h.name.trim()).length === 0}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
          style={{
            background: saved
              ? 'linear-gradient(135deg, #6b8ba4, #78b3a3)'
              : 'linear-gradient(135deg, #d66d5c, #c5a454)',
            color: '#1a1a35',
            boxShadow: saved
              ? '0 10px 30px rgba(107, 139, 164, 0.3)'
              : '0 10px 30px rgba(197, 164, 84, 0.3)',
          }}
          whileTap={{ scale: 0.97 }}
        >
          {saved ? (
            <>
              <Check size={20} />
              저장되었습니다!
            </>
          ) : (
            '저장하고 캔버스로 이동 →'
          )}
        </motion.button>
      </div>
    </div>
  );
}
