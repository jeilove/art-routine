'use client';

import { useEffect, useRef } from 'react';
import { Habit, DayData, calcDayRate } from '@/lib/types';

const COLS = 6;
const ROWS = 5;

interface FragmentCanvasProps {
  habits: Habit[];
  dayData: DayData;
  matisseImg: HTMLImageElement | null;
  size?: number;
  isSmall?: boolean;
}

/**
 * 명화 모드 캔버스
 * 마티스의 창 이미지를 6x5 격자로 나눠 해당 조각을 섹터 마스킹으로 렌더링
 * 달성률 → Opacity (최소 0.15)
 * 달성 시 고유 컬러 틴트(Tint) 오버레이 적용
 * 100% 달성 시 골드 외곽선 발광
 */
export default function FragmentCanvas({
  habits,
  dayData,
  matisseImg,
  size = 56,
  isSmall = true,
}: FragmentCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matisseImg || matisseImg.naturalWidth === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const n = habits.length;
    if (n === 0) return;
    const angleStep = (Math.PI * 2) / n;
    const cx = W / 2;
    const cy = H / 2;
    const MAX_R = Math.sqrt(W * W + H * H);
    const radius = isSmall ? 6 : 12;

    const rate = calcDayRate(habits, dayData.logs);

    // 이 조각이 명화 전체에서 차지하는 위치(6x5 격자)
    const idx = dayData.day - 1;
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const imgTW = matisseImg.naturalWidth / COLS;
    const imgTH = matisseImg.naturalHeight / ROWS;
    const canvasRatio = W / H;
    const imgRatio = imgTW / imgTH;
    let renderW: number, renderH: number;
    if (imgRatio > canvasRatio) {
      renderH = imgTH;
      renderW = renderH * canvasRatio;
    } else {
      renderW = imgTW;
      renderH = renderW / canvasRatio;
    }
    const sx = col * imgTW + (imgTW - renderW) / 2;
    const sy = row * imgTH + (imgTH - renderH) / 2;

    // 클리핑 마스크 (둥근 사각형)
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(2, 2, W - 4, H - 4, radius);
    else ctx.rect(2, 2, W - 4, H - 4);
    ctx.clip();

    ctx.fillStyle = '#0c0c16';
    ctx.fillRect(0, 0, W, H);

    // [개선] 달성 전이라도 명화의 형태를 인지할 수 있도록 15% 투명도 밑그림을 먼저 그림
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.drawImage(matisseImg, sx, sy, renderW, renderH, 0, 0, W, H);
    ctx.restore();

    // 각 습관 섹터 렌더링
    habits.forEach((habit, i) => {
      const log = dayData.logs.find((l) => l.habitId === habit.id);
      const val = log ? log.value / 100 : 0;
      const a0 = -Math.PI / 2 + i * angleStep;
      const a1 = a0 + angleStep;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, MAX_R, a0, a1);
      ctx.closePath();
      ctx.clip();

      // 이미지 조각 렌더링 (최소 0.15 Opacity 보장)
      ctx.globalAlpha = Math.max(0.15, val);
      ctx.drawImage(matisseImg, sx, sy, renderW, renderH, 0, 0, W, H);

      // 달성 시 컬러 틴트 오버레이
      if (val > 0) {
        ctx.globalAlpha = val * 0.18;
        ctx.fillStyle = habit.color;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    });

    // 섹터 구분선
    ctx.strokeStyle = '#0c0c16';
    ctx.lineWidth = isSmall ? 0.8 : 1.5;
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + Math.cos(angle) * MAX_R,
        cy + Math.sin(angle) * MAX_R
      );
      ctx.stroke();
    }

    // 중앙 다이아몬드 코어
    const coreSize = isSmall ? W * 0.18 : W * 0.16;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.rect(-coreSize / 2, -coreSize / 2, coreSize, coreSize);
    if (rate === 1) {
      ctx.fillStyle = '#c5a454';
      ctx.shadowColor = '#c5a454';
      ctx.shadowBlur = isSmall ? 6 : 18;
    } else if (rate > 0) {
      ctx.fillStyle = `rgba(197, 164, 84, ${0.1 + rate * 0.5})`;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
    }
    ctx.fill();
    ctx.lineWidth = isSmall ? 0.5 : 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // 클리핑 해제

    // 외곽선
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(2, 2, W - 4, H - 4, radius);
    else ctx.rect(2, 2, W - 4, H - 4);
    if (rate === 1) {
      ctx.strokeStyle = '#c5a454';
      ctx.lineWidth = isSmall ? 2 : 3;
      ctx.shadowColor = '#c5a454';
      ctx.shadowBlur = isSmall ? 6 : 18;
    } else {
      ctx.strokeStyle = '#3a3a5c';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [habits, dayData, matisseImg, isSmall]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block' }}
    />
  );
}
