import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" }, // 미들웨어 호환을 위해 JWT 전략 고수 (DB 어댑터 사용하더라도 JWT 사용 가능하게)
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, user, token }) {
      // DB 기반 유저 ID 추가 (Adapter 사용 시 유저 객체 활용 가능)
      if (session.user && user) {
        session.user.id = user.id;
      } else if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
})
