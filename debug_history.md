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

#### [에이전트실수] Auth Session 500 에러 (수정 완료)
- **증상**: 온라인 사이트 접속 시 `Art Routine v0.1.2`는 확인되나, `/api/auth/session` 호출 시 500 에러 발생.
- **분석**: `AUTH_SECRET` 환경 변수 누락 및 JWTID 매핑 로직 부재.
- **조치**: 
  - `auth.ts`에 `jwt` 콜백 추가 및 `trustHost: true` 설정.
  - 사용자에게 Vercel 환경 변수(`AUTH_SECRET`, `AUTH_GOOGLE_ID` 등) 등록 안내 후 적용 완료.

#### [에이전트실수] Build Error - Missing Imports (수정 완료)
- **증상**: 로그인 UI 추가 과정에서 `app/page.tsx`에 `useEffect`, `useRouter`, `motion` 임포트 누락으로 빌드 실패.
- **조치**: 누락된 임포트 구문 복구 및 로컬 빌드 테스트 후 재푸시 완료.

### 현재 상태
- [x] 모든 빌드 에러 해결 (로컬 테스트 완료)
- [x] Vercel 환경 변수 연동 완료
- [x] 로그인 UI 및 권한 체크 로직 정상 작동 확인 중
