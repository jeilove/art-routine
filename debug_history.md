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

#### [에이전트실수] Auth Session 500 에러 (조치 중)
- **증상**: 온라인 사이트 접속 시 `Art Routine v0.1.2`는 확인되나, `/api/auth/session` 호출 시 500 에러 발생.
- **분석**: `AUTH_SECRET` 환경 변수 누락 가능성 또는 JWT 전략 전환 시 ID 매핑 로직(`jwt` 콜백) 부재.
- **조치**: 
  - `auth.ts`에 `jwt` 콜백을 추가하여 유저 ID 매핑 로직 보강.
  - `trustHost: true` 및 `debug` 옵션 추가.
  - `.env.example` 파일을 추가하여 필수 환경 변수 안내.
