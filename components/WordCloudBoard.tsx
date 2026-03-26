'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DayData, MATISSE_COLORS } from '@/lib/types';

interface WordCloudBoardProps {
  dailyData: Record<string, DayData>;
  routineDates: string[];
  cycleIndex: number;
}

export default function WordCloudBoard({ dailyData, routineDates, cycleIndex }: WordCloudBoardProps) {
  const keywords = useMemo(() => {
    const dates = routineDates;
    const allMemos = dates.map(d => dailyData[d]?.memo).filter(Boolean);
    const allMoods = dates.map(d => dailyData[d]?.mood).filter(Boolean);

    const words: Record<string, number> = {};
    
    // 단순 공백 분리 및 빈도수 측정 (한글 키워드 추출용)
    allMemos.forEach(memo => {
        const parts = memo!.split(/\s+/);
        parts.forEach(p => {
            if (p.length >= 2) {
                words[p] = (words[p] || 0) + 1;
            }
        });
    });

    // 기분 이모지 추가
    allMoods.forEach(m => {
        words[m!] = (words[m!] || 0) + 3; // 이모지는 가중치 더 줌
    });

    const sorted = Object.keys(words)
        .map(w => ({ text: w, count: words[w] }))
        .sort((a,b) => b.count - a.count)
        .slice(0, 20); // 상위 20개

    return sorted;
  }, [dailyData, routineDates]);

  if (keywords.length === 0) {
      return (
          <div className="h-64 flex items-center justify-center text-xs text-[#666688] italic">
              아직 충분한 기록이 없습니다.
          </div>
      );
  }

  return (
    <div className="w-full h-80 relative flex items-center justify-center overflow-hidden p-6 bg-[#0c0c16] rounded-xl border border-[#3a3a5c]">
       {/* 배경 장식 (마티스 스타일 은은한 도형) */}
       <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-[#d66d5c] blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full bg-[#6b8ba4] blur-3xl animate-pulse" />
       </div>

       <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 relative z-10 w-full">
          {keywords.map((kw, i) => {
              const fontSize = Math.max(12, Math.min(32, 12 + kw.count * 4));
              const color = MATISSE_COLORS[i % MATISSE_COLORS.length].value;
              
              return (
                  <motion.span
                    key={kw.text + i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                    whileHover={{ scale: 1.1, color: '#ffffff', zIndex: 10 }}
                    style={{
                        fontSize: `${fontSize}px`,
                        color: color,
                        fontWeight: kw.count > 2 ? 'bold' : 'normal',
                        cursor: 'default',
                        textShadow: kw.count > 3 ? `0 0 10px ${color}44` : 'none'
                    }}
                    className="font-serif italic tracking-wide"
                  >
                        {kw.text}
                  </motion.span>
              );
          })}
       </div>

       <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-[9px] uppercase tracking-widest" style={{ color: '#444466' }}>
                Mood Cloud — {cycleIndex + 1}nd Narrative
            </p>
       </div>
    </div>
  );
}
