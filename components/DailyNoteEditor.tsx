'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Check } from 'lucide-react';

interface DailyNoteEditorProps {
  initialMemo?: string;
  initialMood?: string;
  onSave: (memo: string, mood: string) => void;
}

const MOODS = [
  { emoji: '✨', label: '뿌듯함' },
  { emoji: '😌', label: '편안함' },
  { emoji: '🌧️', label: '우울함' },
  { emoji: '🔥', label: '열정' },
  { emoji: '💤', label: '지침' },
  { emoji: '😗', label: '보통' },
];

export default function DailyNoteEditor({ initialMemo = '', initialMood = '', onSave }: DailyNoteEditorProps) {
  const [isOpen, setIsOpen] = useState(!!initialMemo || !!initialMood);
  const [memo, setMemo] = useState(initialMemo);
  const [mood, setMood] = useState(initialMood);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onSave(memo, mood);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="mt-6 border-t border-[#3a3a5c] pt-4">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 text-xs font-medium py-2 px-1 hover:text-[#c5a454] transition-colors"
          style={{ color: '#888888' }}
        >
          <Edit3 size={14} />
          <span>오늘의 작가 노트 남기기 (선택)</span>
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3 px-1">
             <span className="text-xs font-bold" style={{ color: '#c5a454' }}>작가 노트</span>
             <button 
                onClick={() => setIsOpen(false)}
                className="text-[10px]"
                style={{ color: '#666688' }}
             >
                닫기
             </button>
          </div>

          {/* 기분 팔레트 */}
          <div className="flex justify-between gap-2 mb-4 bg-[#0c0c16]/50 p-2 rounded-xl">
            {MOODS.map((m) => (
              <button
                key={m.emoji}
                onClick={() => setMood(m.emoji)}
                className="flex flex-col items-center gap-1 flex-1 py-1 rounded-lg transition-all"
                style={{
                  backgroundColor: mood === m.emoji ? '#25254a' : 'transparent',
                  transform: mood === m.emoji ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="text-[9px]" style={{ color: mood === m.emoji ? '#c5a454' : '#666688' }}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          {/* 텍스트 입력 */}
          <div className="relative">
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value.slice(0, 100))}
              placeholder="오늘 하루는 어땠나요? (최대 100자)"
              className="w-full h-24 bg-[#25254a] border border-[#3a3a5c] rounded-xl p-3 text-sm outline-none resize-none"
              style={{ color: '#e8e0ff' }}
            />
            <div className="absolute bottom-3 right-3 text-[10px]" style={{ color: '#666688' }}>
              {memo.length}/100
            </div>
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            className="w-full mt-3 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              backgroundColor: isSaved ? '#78b3a3' : '#3a3a5c',
              color: isSaved ? '#1a1a35' : '#e8e0ff',
            }}
          >
            {isSaved ? (
              <>
                <Check size={16} />
                기록 완료
              </>
            ) : (
              '노트 저장하기'
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}
