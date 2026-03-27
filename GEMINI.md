# 🎨 ART ROUTINE - 전역 지침 (GEMINI.md)

이 문서는 아트 루틴 프로젝트의 설정, 배포 및 운영에 관한 핵심 지침을 담고 있습니다.

## 🏛️ 인프라 & 환경 설정

### 1. Vercel + Neon SQL 설정 (필수)
인증(Auth.js) 및 데이터 기록을 위해 초기 데이터베이스 테이블 생성이 필요합니다.

**방법:**
1. Vercel 대시보드 -> **Storage** -> 연동된 **Neon** 데이터베이스 선택
2. **[Open Neon]** 버튼 클릭 (Neon 관리 콘솔 이동)
3. 왼쪽 메뉴의 **[SQL Editor]** 클릭
4. 기존 내용을 지우고 아래 SQL문을 붙여넣은 뒤 **[Run]** 실행

```sql
-- 테이블 생성 SQL 스크립트 (Auth.js + 비즈니스 로직)
CREATE TABLE IF NOT EXISTS "user" ("id" text PRIMARY KEY NOT NULL, "name" text, "email" text NOT NULL, "emailVerified" timestamp, "image" text, "startDate" text);
CREATE TABLE IF NOT EXISTS "account" ("userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "type" text NOT NULL, "provider" text NOT NULL, "providerAccountId" text NOT NULL, "refresh_token" text, "access_token" text, "expires_at" integer, "token_type" text, "scope" text, "id_token" text, "session_state" text, PRIMARY KEY ("provider", "providerAccountId"));
CREATE TABLE IF NOT EXISTS "session" ("sessionToken" text PRIMARY KEY NOT NULL, "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "expires" timestamp NOT NULL);
CREATE TABLE IF NOT EXISTS "verificationToken" ("identifier" text NOT NULL, "token" text NOT NULL, "expires" timestamp NOT NULL, PRIMARY KEY ("identifier", "token"));
CREATE TABLE IF NOT EXISTS "habit" ("id" text PRIMARY KEY NOT NULL, "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "name" text NOT NULL, "color" text NOT NULL, "inputType" varchar(20) NOT NULL, "order" integer DEFAULT 0 NOT NULL, "createdAt" timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS "daily_data" ("id" serial PRIMARY KEY NOT NULL, "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "dateStr" varchar(10) NOT NULL, "dayNum" integer NOT NULL, "memo" text, "mood" text, "habitSnapshot" jsonb, "updatedAt" timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS "daily_log" ("id" serial PRIMARY KEY NOT NULL, "dailyDataId" integer NOT NULL REFERENCES "daily_data"("id") ON DELETE CASCADE, "habitId" text NOT NULL, "value" integer NOT NULL);
```

### 2. 구글 OAuth (로그인) 리디렉션 URI 설정
Google Cloud Console -> **사용자 인증 정보**에서 다음 URI를 승인해야 합니다.
- `http://localhost:3000/api/auth/callback/google` (로컬 개발용)
- `https://[당신의-도메인].vercel.app/api/auth/callback/google` (온라인 배포용)

#### 🛠️ 로컬 환경 구글 로그인 오류 (400) 해결법
로컬 개발 시 `400: invalid_request` 오류가 발생하면 구글 클라우드 콘솔의 **[OAuth 동의 화면]**에서 다음을 확인하세요:
1. **앱 이름**, **사용자 지원 이메일**, **개발자 연락처 정보**가 모두 채워져 있는지 확인.
2. **테스트 사용자**에 자신의 이메일이 등록되어 있는지 확인 (앱이 '테스트' 상태일 때 필수).
3. **승인된 리디렉션 URI**에 `http://localhost:3000/api/auth/callback/google`이 정확히 포함되어 있는지 확인.

## 🛠️ 개발 원칙
1. **버전 정보**: `app/layout.tsx`와 `package.json`의 버전을 동기화하고 브라우저 콘솔에 로그를 남길 것. (예: `v0.2.1`)
2. **디버깅**: 오류 수정 시 반드시 `debug_history.md`에 기록하고 체크박스로 관리할 것.
3. **Guest 모드**: 로그인을 하지 않아도 로컬 데이터를 사용하여 앱을 사용할 수 있도록 보장할 것.
