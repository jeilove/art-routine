import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      checks: ['pkce', 'state'],
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    authorized({ auth }) {
      // 모든 사용자(로그인/비로그인)가 모든 메뉴에 접근할 수 있도록 개방
      return true;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/', // 커스텀 로그인 페이지가 있으면 수정 가능 (현재 홈에서 로그인 유도라 가정)
  }
} satisfies NextAuthConfig;
