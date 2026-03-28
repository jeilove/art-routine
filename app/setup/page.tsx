'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, Trash2, Check, Download, FolderOpen } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Habit, MATISSE_COLORS, InputType } from '@/lib/types';
import { syncHabits, syncFullBackup, resetUserData } from '@/lib/actions';
import { useSession } from 'next-auth/react';

export default function SetupPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { 
    habits: savedHabits, 
    setHabits, 
    initMockData, 
    resetData, 
    dailyData, 
    startDate, 
    hydrate 
  } = useStore();
  
  const [habits, setLocalHabits] = useState<Habit[]>(savedHabits);
  const [saved, setSaved] = useState(false);
  const [loadingText, setLoadingText] = useState<string | null>(null);

  const isAdmin = session?.user?.email === 'jeilove17@gmail.com';

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

  // 백업하기 (JSON 다운로드)
  const handleExport = () => {
    try {
        const backupData = {
          habits: savedHabits,
          dailyData,
          startDate,
          version: 'v0.2.3',
          exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `art-routine-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch {
        alert('백업 생성 중 오류가 발생했습니다.');
    }
  };

  // 데이터 불러오기 (JSON 업로드)
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (confirm('데이터를 불러오시겠습니까? 현재 기기의 기록이 모두 교체됩니다.')) {
          setLoadingText('데이터 복원 중...');
          
          // 1. 스토어 하이드레이션
          hydrate(json);
          
          // 2. 로컬 모드일 때도 반영되도록 세팅
          if (json.habits) {
            setLocalHabits([...json.habits]);
          }

          // 3. 로그인 상태라면 서버로도 강제 전송 (중요!)
          if (session?.user?.id) {
            await syncFullBackup({
                habits: json.habits || [],
                dailyData: json.dailyData || {},
                startDate: json.startDate || null,
            });
          }
          
          alert('데이터를 성공적으로 불러왔습니다. 확인을 누르시면 캔버스로 이동합니다.');
          
          // 4. 저장소 반영 대기 후 이동
          setTimeout(() => {
            router.push('/dashboard');
          }, 400);
        }
      } catch {
        alert('올바르지 않은 백업 파일입니다.');
      } finally {
        setLoadingText(null);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ backgroundColor: '#0c0c16' }}
    >
      {/* 로딩 오버레이 */}
      {loadingText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
           <div className="text-white font-bold flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-[#c5a454] border-t-transparent rounded-full animate-spin" />
              <p>{loadingText}</p>
           </div>
        </div>
      )}

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
        
        {/* 데이터 백업/복구 섹션 (모든 사용자) */}
        <div className="mb-6 grid grid-cols-2 gap-3">
           <button 
             onClick={handleExport}
             className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25254a] border border-white/5 text-[11px] font-bold text-white/80 transition-all active:scale-95"
           >
             <Download size={14} className="text-[#c5a454]" />
             데이터 백업하기
           </button>
           <label className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25254a] border border-white/5 text-[11px] font-bold text-white/80 cursor-pointer transition-all active:scale-95">
             <FolderOpen size={14} className="text-[#c5a454]" />
             데이터 불러오기
             <input type="file" accept=".json" onChange={handleImport} className="hidden" />
           </label>
        </div>

        {/* 루틴 시작일 설정 섹션 */}
        <div className="mb-6 rounded-2xl p-4 border" style={{ backgroundColor: '#161630', borderColor: '#3a3a5c' }}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#c5a454]">루틴 시작일 설정</span>
                <p className="text-[10px]" style={{ color: '#666688' }}>※ 30일 주기와 명화 변경의 기준이 됩니다.</p>
            </div>
            <input
                type="date"
                value={startDate || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  useStore.setState({ startDate: val });
                }}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: '#25254a',
                  border: '1px solid #3a3a5c',
                  color: '#e8e0ff',
                }}
            />
        </div>

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
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 border border-dashed transition-colors mb-6"
            style={{ borderColor: '#3a3a5c', color: '#666688' }}
            whileHover={{ borderColor: '#f0c040', color: '#f0c040' }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={18} />
            <span className="text-sm font-bold">습관 추가</span>
          </motion.button>
        )}

        {/* 데이터 관리 섹션 */}
        <div className="mt-12 flex flex-col gap-3 pb-8">
          <p className="text-[10px] text-center mb-1" style={{ color: '#666688' }}>
            ※ 샘플 데이터 로드시 현재 모든 기록이 초기화되거나 덮어씌워질 수 있습니다.
          </p>
          <div className="flex gap-3">
            <button
                onClick={() => {
                if (confirm('샘플 조각들을 채워보시겠습니까? (현재 기록이 덮어씌워질 수 있습니다)')) {
                    initMockData();
                    router.push('/dashboard');
                }
                }}
                className="flex-1 py-3 rounded-xl border border-[#c5a454]/20 bg-[#c5a454]/5 text-[10px] font-bold text-[#c5a454] transition-all active:scale-95"
            >
                🎨 샘플 데이터 로드 (30일분)
            </button>
            
            {isAdmin && (
              <button
                  onClick={async () => {
                  if (confirm('모든 기록을 삭제하고 처음부터 시작하시겠습니까? (서버 데이터도 모두 삭제됩니다)')) {
                      setLoadingText('모든 기록을 깨끗하게 비우는 중...'); 
                      const result = await resetUserData();
                      
                      if (result.success) {
                          resetData(); // 로컬 스토어 초기화
                          setTimeout(() => {
                            setLoadingText(null);
                            router.push('/');
                          }, 800);
                      } else {
                          setLoadingText(null);
                          alert(`초기화 실패: ${result.error || '잠시 후 다시 시도해 주세요.'}`);
                      }
                  }
                  }}
                  className="flex-1 py-3 rounded-xl border border-red-500/20 text-[10px] font-bold text-red-500/40 hover:bg-red-500/5 transition-all"
              >
                  전체 초기화 (관리자)
              </button>
            )}
          </div>
        </div>
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
          className="w-full py-[13px] rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
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
