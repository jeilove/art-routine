export interface ColorInfo {
  label: string;
  value: string;
}

// 마티스 8색 팔레트 (채도를 낮춘 은은한 톤)
export const MATISSE_COLORS: ColorInfo[] = [
  { label: 'Rose Muted', value: '#d66d5c' },    // Matisse Red v2
  { label: 'Blue Muted', value: '#6b8ba4' },    // Matisse Blue v2
  { label: 'Ochre Muted', value: '#c5a454' },   // Matisse Ochre/Gold v2
  { label: 'Leaf Muted', value: '#78b3a3' },    // Matisse Green v2
  { label: 'Yellow Dark', value: '#bfae5a' },   // Matisse Yellow v2
  { label: 'Night Blue', value: '#364b6b' },    // Matisse Deep Blue v2
  { label: 'Peach Soft', value: '#d49a7a' },    // Matisse Peach v2
  { label: 'Lavender Gray', value: '#8a83a6' }, // Matisse Violet v2
];

export interface Masterpiece {
  id: string;
  title: string;
  artist: string;
  image: string;
}

export const MASTERPIECES: Masterpiece[] = [
  { id: 'matisse_window', title: 'The Open Window', artist: 'Henri Matisse', image: '/matisse.jpg' },
  { id: 'klimt_kiss', title: 'The Kiss', artist: 'Gustav Klimt', image: '/masterpieces/klimt_kiss.jpg' },
  { id: 'matisse_dance', title: 'Dance (II)', artist: 'Henri Matisse', image: '/masterpieces/matisse_dance.jpg' },
  { id: 'seurat_sunday', title: 'A Sunday Afternoon on the Island of La Grande Jatte', artist: 'Georges Seurat', image: '/masterpieces/seurat_sunday.jpg' },
];

// 기본 습관 템플릿 (초기 Mock용)
export const DEFAULT_HABITS: Habit[] = [
  { id: '1', name: '명상 10분', color: '#e84020', inputType: 'binary', order: 0 },
  { id: '2', name: '독서 20페이지', color: '#40d0b0', inputType: 'percent', order: 1 },
  { id: '3', name: '스트레칭', color: '#4a8030', inputType: 'binary', order: 2 },
  { id: '4', name: '물 2리터', color: '#3a7abd', inputType: 'percent', order: 3 },
  { id: '5', name: '일기 쓰기', color: '#9b7bff', inputType: 'binary', order: 4 },
];

export type InputType = 'binary' | 'percent';
export type ViewMode = 'palette' | 'fragment';

export interface Habit {
  id: string;
  name: string;
  color: string;
  inputType: InputType;
  order: number;
}

export interface DailyLog {
  habitId: string;
  value: number; // binary: 0 or 100, percent: 0~100
}

export interface DayData {
  day: number; // 1~30 (루틴 상의 일차)
  logs: DailyLog[];
  memo?: string; // 한 줄 평 (최대 100자)
  mood?: string; // 감정 이모지/키워드
  habitSnapshot?: Habit[]; // 기록 시점의 습관 목록 스냅샷 (과거 데이터 불변성 유지)
}

// 일간 달성률 계산 (0~1 사이 값)
// 각 습관의 달성률 평균 = 하루의 전체 완성도
export function calcDayRate(habits: Habit[], logs: DailyLog[]): number {
  if (habits.length === 0) return 0;
  const total = habits.reduce((sum, h) => {
    const log = logs.find((l) => l.habitId === h.id);
    return sum + (log ? log.value / 100 : 0);
  }, 0);
  return total / habits.length;
}
