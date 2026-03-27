# Debug History - Art Routine

## 2026-03-27
- [x] Next.js Build 성패 여부 확인 (빌드 성공, Exit Code: 0)
- [x] `auth.ts`에 따른 Middleware Edge Runtime 호환성 문제 해결
- [x] ESLint 경고 및 에러 수정 (DailyNoteEditor `useEffect` 리팩토링 및 미사용 변수 제거)
- [x] Vercel 배포를 위한 `auth.config.ts` 분리
- [x] 실시간 동기화 훅 (`useSync`) 및 서버 액션 로직 점검
- [x] `next/font/google` 마이그레이션 (Next.js 권장 사항 반영)

### 오류 분석 및 조치
#### [에이전트실수] Auth.js 미들웨어 Edge Runtime 이슈 (수정 완료)
- **증상**: `NextAuth`에 `DrizzleAdapter`와 `db`가 포함되어 미들웨어(Edge Runtime)에서 Node.js 전용 API 호출 에러 발생.
- **조치**: `auth.config.ts`를 생성하여 DB와 무관한 공통 설정만 담고, 미들웨어에서는 이를 사용하도록 분리함. `auth.ts`는 서버 사이드에서 어댑터를 연결하여 사용함.

#### [버전문제] ESLint Build Error (수정 완료)
- **증상**: `next build` 시 ESLint 경고가 에러로 처리되어 빌드 중단.
- **조치**: 
  - `DailyNoteEditor.tsx`에서 `useEffect` 내 `setState` 호출로 인한 경고를 부모 컴포넌트(`DashboardPage`)에서 `key={selectedDay}`를 사용하는 방식으로 리팩토링하여 해결.
  - 미사용 변수(`InputType`, `generateMockData`, `boolean`, `Sparkles`, `Info` 등) 전수 제거.
  - `useEffect` 의존성 배열에 누락된 의존성 추가.

#### [성능향상] 폰트 로딩 최적화
- **증상**: `<link>` 방식의 외부 폰트 로드 경고 발생.
- **조치**: `next/font/google`을 사용하여 `Noto Sans KR` 폰트를 최적화하고 경고를 제거함.
