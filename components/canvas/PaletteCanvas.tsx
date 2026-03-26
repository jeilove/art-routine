'use client';

import { useEffect, useRef } from 'react';
import { Habit, DayData, calcDayRate } from '@/lib/types';

interface PaletteCanvasProps {
  habits: Habit[];
  dayData: DayData;
  size?: number;
  isSmall?: boolean;
}

/**
 * 팔레트 모드 캔버스
 * 원형 파이 차트 형태로 습관별 고유 컬러 섹터를 그림
 * 달성률(0~1) → Opacity 매핑 (최소 0.15 보장)
 * 100% 달성 시 중앙 코어 + 외곽선 골드 발광
 */
export default function PaletteCanvas({
  habits,
  dayData,
  size = 56,
  isSmall = true,
}: PaletteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) / 2 - (isSmall ? 2 : 4);
    const n = habits.length;
    if (n === 0) return;
    const angleStep = (Math.PI * 2) / n;

    // 배경 원
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = '#0c0c16';
    ctx.fill();

    const rate = calcDayRate(habits, dayData.logs);

    // 각 습관 섹터 그리기
    habits.forEach((habit, i) => {
      const log = dayData.logs.find((l) => l.habitId === habit.id);
      const val = log ? log.value / 100 : 0;
      const a0 = -Math.PI / 2 + i * angleStep;
      const a1 = a0 + angleStep;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, a0, a1);
      ctx.closePath();
      ctx.globalAlpha = Math.max(0.15, val); // 최소 15% 밑그림 보장
      ctx.fillStyle = habit.color;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // 섹터 구분선
    ctx.strokeStyle = '#0c0c16';
    ctx.lineWidth = isSmall ? 1 : 2;
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
      ctx.stroke();
    }

    // 중앙 코어
    const coreR = isSmall ? R * 0.25 : R * 0.22;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    if (rate === 1) {
      ctx.fillStyle = '#c5a454';
      ctx.shadowColor = '#c5a454';
      ctx.shadowBlur = isSmall ? 6 : 18;
    } else if (rate > 0) {
      ctx.fillStyle = `rgba(197, 164, 84, ${0.1 + rate * 0.6})`;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = isSmall ? 0.5 : 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.stroke();

    // 외곽선
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    if (rate === 1) {
      ctx.strokeStyle = '#c5a454';
      ctx.lineWidth = isSmall ? 1.5 : 3;
      ctx.shadowColor = '#c5a454';
      ctx.shadowBlur = isSmall ? 6 : 18;
    } else {
      ctx.strokeStyle = '#3a3a5c';
      ctx.lineWidth = 1;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [habits, dayData, isSmall]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block' }}
    />
  );
}
