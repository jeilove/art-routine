'use client';

import { motion } from 'framer-motion';
import { Info, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { DayData, Habit } from '@/lib/types';

interface AiDocentCaptionProps {
  dailyData: Record<string, DayData>;
  habits: Habit[];
  routineDates: string[]; // 현재 사이클의 30일 날짜들
  cycleIndex: number;     // 현재 몇 번째 사이클인지
}

export default function AiDocentCaption({ dailyData, habits, routineDates, cycleIndex }: AiDocentCaptionProps) {
  // 간단한 로컬 분석 로직 (도슨트 톤)
  const analysis = useMemo(() => {
    const dates = routineDates;
    const recordedDates = dates.filter(d => !!dailyData[d]);
    if (recordedDates.length === 0) return "아직 이 여정의 기록이 충분하지 않습니다. 캔버스를 조금 더 채워주세요.";

    const totalLogs = recordedDates.reduce((acc, d) => acc + (dailyData[d].logs.length || 0), 0);
    const completedLogs = recordedDates.reduce((acc, d) => {
        return acc + (dailyData[d].logs?.filter(l => l.value === 100).length || 0);
    }, 0);

    const completionRate = totalLogs > 0 ? (completedLogs / totalLogs) * 100 : 0;
    
    // 가장 많이 기록된 기분 찾기
    const moods = recordedDates.map(d => dailyData[d].mood).filter(Boolean);
    const moodCount: Record<string, number> = {};
    moods.forEach(m => { moodCount[m!] = (moodCount[m!] || 0) + 1; });
    const dominantMood = Object.keys(moodCount).sort((a,b) => moodCount[b] - moodCount[a])[0] || '😗';

    const moodMeanings: Record<string, string> = {
        '✨': '성취감으로 반짝이는',
        '😌': '평온하고 아늑한',
        '🌧️': '비 오는 날처럼 차분한',
        '🔥': '열정이 뜨겁게 타오르는',
        '💤': '고단함 속에서도 쉼을 찾은',
        '😗': '담백하고 일상적인'
    };

    let text = `${cycleIndex + 1}번째 여정(Cycle)의 캔버스는 ${moodMeanings[dominantMood] || '특별한'} 기운이 전체를 감싸고 있습니다. `;
    
    if (completionRate > 70) {
        text += "당신의 성실함이 빚어낸 선명한 색채들이 작품의 깊이를 더해주었네요. 마치 밝은 햇살이 창가를 비추는 듯한 생동감이 느껴집니다.";
    } else if (completionRate > 40) {
        text += "완성되어가는 과정 속에서 보여준 당신의 리듬이 고스란히 담겨 있습니다. 부족한 조각들마저도 하나의 예술적 여백으로 조화롭게 어우러집니다.";
    } else {
        text += "아직은 밑그림 단계에 가깝지만, 당신이 남긴 몇 안 되는 조각들이 오히려 강렬한 존재감을 드러냅니다. 여정의 끝에 어떤 색들이 더 채워질지 기대되는 작품입니다.";
    }

    return text;
  }, [dailyData, routineDates, cycleIndex]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 p-5 rounded-2xl border bg-[#1a1a35]/80 backdrop-blur-sm relative overflow-hidden"
      style={{ borderColor: '#c5a45444' }}
    >
        {/* 장식용 골드 라인 */}
        <div className="absolute top-0 left-0 w-1 h-full bg-[#c5a454]" />

        <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-[#c5a454]" />
            <h4 className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#c5a454' }}>
                Exhibition Caption
            </h4>
        </div>

        <p className="text-sm leading-relaxed italic" style={{ color: '#e8e0ffcc' }}>
            "{analysis}"
        </p>

        <div className="mt-4 pt-4 border-t border-[#3a3a5c] flex justify-between items-end">
             <div>
                <p className="text-[10px] uppercase tracking-tighter" style={{ color: '#666688' }}>Artist</p>
                <p className="text-xs font-bold" style={{ color: '#ffffff' }}>당신이라는 창술가</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] uppercase tracking-tighter" style={{ color: '#666688' }}>Material</p>
                <p className="text-xs" style={{ color: '#ffffff' }}>습관의 물감과 감정의 조각들</p>
             </div>
        </div>
    </motion.div>
  );
}
