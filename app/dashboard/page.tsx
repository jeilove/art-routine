'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Settings, ChevronDown, ChevronUp, Frame, RefreshCw, Sparkles, ChevronRight } from 'lucide-react';
import { useStore } from '@/lib/store';
import { DayData, ViewMode, MASTERPIECES } from '@/lib/types';
import PaletteCanvas from '@/components/canvas/PaletteCanvas';
import FragmentCanvas from '@/components/canvas/FragmentCanvas';
import GalleryCanvas from '@/components/canvas/GalleryCanvas';
import HabitCheckList from '@/components/HabitCheckList';
import DailyNoteEditor from '@/components/DailyNoteEditor';
import AiDocentCaption from '@/components/AiDocentCaption';
import WordCloudBoard from '@/components/WordCloudBoard';
import AuthButton from '@/components/AuthButton';
import { useSync } from '@/hooks/useSync';
import { syncDailyData } from '@/lib/actions';

// 총 30일 루틴 기준
const TOTAL_DAYS = 30;

// 명화 이미지 로더 훅 (URL 기반)
function useMasterpieceImage(imageUrl: string): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!imageUrl) return;
    const image = new window.Image();
    image.crossOrigin = 'Anonymous';
    image.src = imageUrl;
    image.onload = () => setImg(image);
  }, [imageUrl]);
  return img;
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    habits,
    viewMode,
    selectedDay,
    dailyData,
    startDate,
    setViewMode,
    setSelectedDay,
    setLog,
    setDayNote,
    getDayData,
    getDayRate,
    initMockData,
  } = useStore();

  const { sync } = useSync(); // 로그인 시 자동 동기화

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  // 오늘 날짜 문자열 (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (Object.keys(dailyData).length === 0 && !startDate) {
      initMockData();
    }
  }, []);

  // 오늘이 총 몇 번째 조약인지 (1부터 시작)
  const todayGlobalIndex = useMemo(() => {
    if (!startDate) return 1;
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1;
  }, [startDate]);

  // 현재 사이클 (0부터 시작)
  const currentCycleIdx = Math.max(0, Math.floor((todayGlobalIndex - 1) / TOTAL_DAYS));
  
  // 현재 보고 있는 사이클 상태
  const [viewCycleIdx, setViewCycleIdx] = useState(currentCycleIdx);

  // 현재 사이클의 명화 정보
  const currentMasterpiece = MASTERPIECES[viewCycleIdx % MASTERPIECES.length];
  const masterpieceImg = useMasterpieceImage(currentMasterpiece.image);

  // 선택된 날짜 데이터 (문자열 키 기반)
  const selectedDayData: DayData = selectedDay
    ? getDayData(selectedDay)
    : { day: 0, logs: [] };

  // 날짜 타일 클릭 핸들러
  const handleSelectDay = (dateStr: string) => {
    const targetDate = new Date(dateStr);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // 오늘까지는 선택 가능

    if (targetDate > today) return;

    setSelectedDay(dateStr);
    setIsDetailOpen(true); // 조각 클릭 시 아코디언 열기
  };

  const handleLogUpdate = useCallback(
    async (habitId: string, value: number) => {
      if (!selectedDay) return;
      setLog(selectedDay, habitId, value);
      
      // 클라우드 동기화 (비동기)
      const currentData = getDayData(selectedDay);
      const updatedLogs = [...currentData.logs.filter(l => l.habitId !== habitId), { habitId, value }];
      syncDailyData(selectedDay, { ...currentData, logs: updatedLogs });
    },
    [selectedDay, setLog, getDayData]
  );

  const handleNoteUpdate = useCallback(
    async (memo: string, mood: string) => {
      if (!selectedDay) return;
      setDayNote(selectedDay, memo, mood);
      
      // 클라우드 동기화
      const currentData = getDayData(selectedDay);
      syncDailyData(selectedDay, { ...currentData, memo, mood });
    },
    [selectedDay, setDayNote, getDayData]
  );

  // 현재 보고 있는 사이클(30일)의 날짜 배열 생성
  const routineDates = useMemo(() => {
    if (!startDate) return [];
    const dates = [];
    const start = new Date(startDate);
    // 사이클 오프셋 적용
    start.setDate(start.getDate() + viewCycleIdx * TOTAL_DAYS);
    
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [startDate, viewCycleIdx]);

  // 아코디언 헤더를 터치했을 때 당일 조각 수정으로 열기
  const handleDetailAccordionToggle = () => {
    if (!isDetailOpen) {
      // 닫혀있다가 열릴 때, 선택된 날이 없으면 오늘로 자동 지정
      if (!selectedDay) {
        setSelectedDay(todayStr);
      }
    }
    setIsDetailOpen(!isDetailOpen);
  };

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ backgroundColor: '#0c0c16', color: '#e8e0ff' }}
    >
      {/* 상단 헤더 */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 px-5 py-4 border-b"
        style={{ backgroundColor: '#0c0c16cc', backdropFilter: 'blur(12px)', borderColor: '#2a2a4a' }}
      >
        <button onClick={() => router.push('/')} className="p-2 rounded-xl" style={{ color: '#aaaaaa' }}>
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1">
          <p className="text-xs font-bold" style={{ color: '#c5a454' }}>
            MY ART ROUTINE
          </p>
          <p className="text-[10px]" style={{ color: '#666688' }}>
             {todayStr} (Day {todayGlobalIndex})
          </p>
        </div>
        
        {/* 뷰 토글 */}
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: '#3a3a5c' }}>
          {(['palette', 'fragment'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="px-3 py-2 text-xs font-bold transition-all duration-200"
              style={{
                backgroundColor: viewMode === mode ? '#3a3a5c' : '#161630',
                color: viewMode === mode ? '#c5a454' : '#666688',
              }}
            >
              {mode === 'palette' ? '🎨 팔레트' : '🖼️ 명화'}
            </button>
          ))}
        </div>

        <AuthButton />

        <button onClick={() => router.push('/setup')} className="p-2 rounded-xl" style={{ color: '#aaaaaa' }}>
          <Settings size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-12">
        {/* ─────────────────────────────────────── */}
        {/* 섹션 1: 30일 루틴 캔버스 및 사이클 네비게이션 */}
        {/* ─────────────────────────────────────── */}
        <div className="mt-6 mb-8">
           {/* 사이클 내비게이션 */}
           <div className="flex items-center justify-between mb-4 bg-[#1a1a35] p-2 rounded-2xl border border-[#3a3a5c]">
              <button 
                onClick={() => setViewCycleIdx(Math.max(0, viewCycleIdx - 1))}
                disabled={viewCycleIdx === 0}
                className="p-2 disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                  <p className="text-[10px] font-bold" style={{ color: '#c5a454' }}>Cycle {viewCycleIdx + 1}</p>
                  <p className="text-[11px] font-serif italic truncate max-w-[180px]" style={{ color: '#e8e0ff' }}>
                    {currentMasterpiece.title}
                  </p>
              </div>
              <button 
                onClick={() => setViewCycleIdx(viewCycleIdx + 1)}
                disabled={viewCycleIdx >= currentCycleIdx}
                className="p-2 disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
           </div>

           <div className="grid grid-cols-6 gap-x-2 gap-y-4">
              {routineDates.map((dateStr, idx) => {
                const date = new Date(dateStr);
                const isSelected = selectedDay === dateStr;
                const isToday = dateStr === todayStr;
                const isFuture = date > new Date();
                const dayNum = date.getDate();
                const monthNum = date.getMonth() + 1;

                return (
                  <div
                    key={dateStr}
                    className="flex flex-col items-center gap-1 cursor-pointer"
                    style={{ opacity: isFuture ? 0.3 : 1 }}
                    onClick={() => handleSelectDay(dateStr)}
                  >
                    <div
                      className="relative"
                      style={{
                        outline: isSelected ? '2px solid #ffffff' : isToday ? '1.5px solid #c5a454' : 'none',
                        outlineOffset: '2px',
                        borderRadius: viewMode === 'palette' ? '50%' : '6px',
                        boxShadow: isToday ? '0 0 10px rgba(197, 164, 84, 0.3)' : 'none'
                      }}
                    >
                      {viewMode === 'fragment' ? (
                        <FragmentCanvas
                          habits={getDayData(dateStr).habitSnapshot || habits}
                          dayData={{ ...getDayData(dateStr), day: idx + 1 }}
                          matisseImg={masterpieceImg}
                          size={52}
                          isSmall
                        />
                      ) : (
                        <PaletteCanvas
                          habits={getDayData(dateStr).habitSnapshot || habits}
                          dayData={getDayData(dateStr)}
                          size={52}
                          isSmall
                        />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '8px',
                        color: isSelected ? '#ffffff' : isToday ? '#c5a454' : '#666688',
                        fontWeight: (isSelected || isToday) ? 'bold' : 'normal',
                      }}
                    >
                      {monthNum}/{dayNum}
                    </span>
                  </div>
                );
              })}
           </div>
        </div>

        {/* ─────────────────────────────────────── */}
        {/* 섹션 2: 일간 기록 상세 (아코디언) */}
        {/* ─────────────────────────────────────── */}
        <div 
          className="mt-4 rounded-2xl border overflow-hidden transition-all duration-300"
          style={{ backgroundColor: '#1a1a35', borderColor: '#3a3a5c' }}
        >
          <button 
            onClick={handleDetailAccordionToggle}
            className="w-full flex items-center justify-between p-4 bg-[#1e1e3e]"
          >
            <div className="flex items-center gap-3">
              <span className="p-1.5 rounded-lg bg-[#25254a]">
                <Settings size={16} className="text-[#c5a454]" />
              </span>
              <div className="text-left">
                <h3 className="font-bold text-sm" style={{ color: '#e8e0ff' }}>
                  {selectedDay ? `${selectedDay.split('-')[1]}월 ${selectedDay.split('-')[2]}일 기록` : '습관 기록장'}
                </h3>
                <p className="text-[10px]" style={{ color: '#888888' }}>
                  오늘의 물감으로 캔버스를 채워주세요
                </p>
              </div>
            </div>
            {isDetailOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          <AnimatePresence>
            {isDetailOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-4 border-t border-[#3a3a5c]">
                  {selectedDay ? (
                    <>
                      <div className="flex items-center gap-4 mb-5 p-3 rounded-xl bg-[#0c0c16]/50">
                        <div
                          className="shrink-0"
                          style={{
                            borderRadius: viewMode === 'palette' ? '50%' : '8px',
                          }}
                        >
                          {viewMode === 'fragment' ? (
                            <FragmentCanvas
                              habits={selectedDayData.habitSnapshot || habits}
                              dayData={{ ...selectedDayData, day: routineDates.indexOf(selectedDay) + 1 }}
                              matisseImg={masterpieceImg}
                              size={64}
                              isSmall={false}
                            />
                          ) : (
                            <PaletteCanvas
                              habits={selectedDayData.habitSnapshot || habits}
                              dayData={selectedDayData}
                              size={64}
                              isSmall={false}
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: '#888888' }}>
                             {selectedDay} 조각의 상태
                          </p>
                          <p className="text-sm font-bold" style={{ color: '#c5a454' }}>
                            {Math.round(getDayRate(selectedDay) * 100)}% 차오름
                          </p>
                        </div>
                      </div>

                      <HabitCheckList
                        habits={habits}
                        dayData={selectedDayData}
                        onUpdate={handleLogUpdate}
                      />

                      <DailyNoteEditor 
                        initialMemo={selectedDayData.memo}
                        initialMood={selectedDayData.mood}
                        onSave={handleNoteUpdate}
                      />
                    </>
                  ) : (
                    <div className="py-8 text-center text-xs" style={{ color: '#666688' }}>
                      달력에서 날짜를 터치하면 상세 기록이 나타납니다.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─────────────────────────────────────── */}
        {/* 섹션 3: 명화 갤러리 (아코디언) */}
        {/* ─────────────────────────────────────── */}
        <div
          className="mt-6 rounded-2xl border overflow-hidden"
          style={{ backgroundColor: '#161630', borderColor: '#3a3a5c' }}
        >
          <button 
            onClick={() => setIsGalleryOpen(!isGalleryOpen)}
            className="w-full flex items-center justify-between p-4 bg-[#1a1a35]"
          >
            <div className="flex items-center gap-3">
              <span className="p-1.5 rounded-lg bg-[#25254a]">
                <Frame size={16} className="text-[#c5a454]" />
              </span>
              <div className="text-left">
                <h3 className="font-bold text-sm" style={{ color: '#e8e0ff' }}>
                   내 삶의 마스터피스
                </h3>
                <p className="text-[10px]" style={{ color: '#666688' }}>
                  {Object.keys(dailyData).length}/30일의 조각이 모였습니다
                </p>
              </div>
            </div>
            {isGalleryOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          <AnimatePresence>
            {isGalleryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-4 border-t border-[#3a3a5c]">
                  <div className="relative mb-4">
                    <p className="text-[10px] text-center mb-1 italic font-bold" style={{ color: '#c5a454' }}>
                      {currentMasterpiece.artist}
                    </p>
                    <p className="text-[10px] text-center mb-3 italic" style={{ color: '#666688' }}>
                      {currentMasterpiece.title}
                    </p>
                    
                    {masterpieceImg ? (
                      <div className="relative" style={{ perspective: '1200px' }}>
                        <motion.div
                          animate={{ rotateY: isFlipped ? 180 : 0 }}
                          transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                          style={{ transformStyle: 'preserve-3d' }}
                          className="relative w-full"
                        >
                          {/* 앞면: 명화 갤러리 */}
                          <div style={{ backfaceVisibility: 'hidden' }}>
                            <GalleryCanvas
                              habits={habits}
                              dailyData={dailyData}
                              startDateStr={startDate}
                              matisseImg={masterpieceImg}
                              width={400}
                              height={334}
                              cycleOffset={viewCycleIdx * TOTAL_DAYS}
                            />
                          </div>

                          {/* 뒷면: 워드 클라우드 */}
                          <div 
                            className="absolute inset-0" 
                            style={{ 
                              backfaceVisibility: 'hidden', 
                          transform: 'rotateY(180deg)' 
                            }}
                          >
                            <WordCloudBoard 
                              dailyData={dailyData}
                              routineDates={routineDates}
                              cycleIndex={viewCycleIdx}
                            />
                          </div>
                        </motion.div>

                        {/* 뒤집기 버튼 */}
                        <button
                          onClick={() => setIsFlipped(!isFlipped)}
                          className="absolute -top-10 right-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all"
                          style={{ 
                            backgroundColor: isFlipped ? '#c5a454' : '#25254a',
                            color: isFlipped ? '#1a1a35' : '#c5a454',
                            border: '1px solid #c5a45444'
                          }}
                        >
                          {isFlipped ? (
                            <>
                              <Frame size={12} />
                              작품 보기
                            </>
                          ) : (
                            <>
                              <RefreshCw size={12} />
                              감정 클라우드
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-xs text-[#444466]">
                        캔버스 로딩 중...
                      </div>
                    )}
                  </div>

                  {/* AI 도슨트 작품 해설 */}
                  <AiDocentCaption 
                    dailyData={dailyData}
                    habits={habits}
                    routineDates={routineDates}
                    cycleIndex={viewCycleIdx}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
