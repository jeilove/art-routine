'use client';

import { useEffect, useRef } from 'react';
import { Habit, DayData, calcDayRate } from '@/lib/types';

const COLS = 6;
const ROWS = 5;
const TOTAL_DAYS = 30;

interface GalleryCanvasProps {
  habits: Habit[];
  dailyData: Record<string, DayData>;
  startDateStr: string | null;
  matisseImg: HTMLImageElement | null;
  width?: number;
  height?: number;
  cycleOffset?: number; // 사이클 기반 시작 일수 (ex: 0, 30, 60...)
}

/**
 * 하단 전체 명화 갤러리 캔버스 (6x5 = 30조각)
 * 각 조각: 습관 섹터별로 마티스 이미지 마스킹
 * 미래 날짜: 15% Opacity 밑그림만 표시
 * 100% 달성 조각: 골드 외곽선 발광
 */
export default function GalleryCanvas({
  habits,
  dailyData,
  startDateStr,
  matisseImg,
  width = 340,
  height = 284,
  cycleOffset = 0,
}: GalleryCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matisseImg || matisseImg.naturalWidth === 0 || !startDateStr) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = '#0c0c16';
    ctx.fillRect(0, 0, W, H);

    const tw = W / COLS;
    const th = H / ROWS;
    const n = habits.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(startDateStr);

    for (let d = 0; d < TOTAL_DAYS; d++) {
      const globalIdx = d + cycleOffset; // 사이클 옵셋 적용
      const col = d % COLS;
      const row = Math.floor(d / COLS);
      const x = col * tw;
      const y = row * th;
      const cx = x + tw / 2;
      const cy = y + th / 2;
      const MAX_R = Math.sqrt(tw * tw + th * th);

      const targetDate = new Date(startDate);
      targetDate.setDate(startDate.getDate() + globalIdx);
      const dateKey = targetDate.toISOString().split('T')[0];
      const data = dailyData[dateKey];
      const isFuture = targetDate > today;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, tw, th);
      ctx.clip();

      // [공용] 베이스 레이어 — 15% 밑그림 (형태 인지용)
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.drawImage(
        matisseImg,
        (col * matisseImg.naturalWidth) / COLS,
        (row * matisseImg.naturalHeight) / ROWS,
        matisseImg.naturalWidth / COLS,
        matisseImg.naturalHeight / ROWS,
        x,
        y,
        tw,
        th
      );
      ctx.restore();

      // 미래 날짜 또는 데이터 없음 → 15% 밑그림만 그리고 종료 (테두리 포함)
      if (isFuture || !data || n === 0) {
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, tw, th);
        ctx.restore();
        continue;
      }

      // 과거/오늘 날짜 → 섹터 마스킹 렌더링
      const targetHabits = data.habitSnapshot || habits;
      const actualN = targetHabits.length;
      if (actualN === 0) {
        ctx.restore();
        continue;
      }

      const angleStep = (Math.PI * 2) / actualN;
      targetHabits.forEach((habit, i) => {
        const log = data.logs.find((l) => l.habitId === habit.id);
        const val = log ? log.value / 100 : 0;
        const a0 = -Math.PI / 2 + i * angleStep;
        const a1 = a0 + angleStep;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, MAX_R, a0, a1);
        ctx.closePath();
        ctx.clip();

        ctx.globalAlpha = Math.max(0.15, val);
        ctx.drawImage(
          matisseImg,
          (col * matisseImg.naturalWidth) / COLS,
          (row * matisseImg.naturalHeight) / ROWS,
          matisseImg.naturalWidth / COLS,
          matisseImg.naturalHeight / ROWS,
          x,
          y,
          tw,
          th
        );

        if (val > 0) {
          ctx.globalAlpha = val * 0.15;
          ctx.fillStyle = habit.color;
          ctx.fillRect(x, y, tw, th);
        }

        ctx.restore();
      });

      // 100% 달성 골드 외곽선
      const rate = calcDayRate(targetHabits, data.logs);
      if (rate === 1) {
        ctx.strokeStyle = '#c5a454'; // Muted gold
        ctx.lineWidth = 2;
        ctx.shadowColor = '#c5a454';
        ctx.shadowBlur = 8;
        ctx.strokeRect(x + 1, y + 1, tw - 2, th - 2);
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = '#2a2a4a';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, tw, th);
      }

      ctx.restore();
    }
  }, [habits, dailyData, startDateStr, matisseImg, cycleOffset]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        display: 'block',
        width: '100%',
        borderRadius: '8px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
      }}
    />
  );
}
