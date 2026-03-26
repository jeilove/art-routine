'use client'

import { signIn, signOut, useSession } from "next-auth/react"
import { LogIn, LogOut, User } from "lucide-react"
import Image from "next/image"

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />;

  if (session) {
    return (
      <div className="flex items-center gap-3 bg-white/5 p-1 pr-3 rounded-full border border-white/10">
        {session.user?.image ? (
          <Image src={session.user.image} alt={session.user.name || ""} width={32} height={32} className="rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#c5a454] flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
        )}
        <div className="flex flex-col">
            <span className="text-[10px] text-white/50 leading-none">Creator</span>
            <span className="text-xs font-bold text-white leading-tight">{session.user?.name}</span>
        </div>
        <button 
          onClick={() => signOut()}
          className="ml-2 p-1.5 hover:bg-white/10 rounded-full transition-colors"
          title="로그아웃"
        >
          <LogOut size={14} className="text-white/40" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="flex items-center gap-2 px-4 py-2 bg-[#c5a454] text-white rounded-full text-sm font-bold hover:bg-[#b08d44] transition-all shadow-lg"
    >
      <LogIn size={16} />
      <span>Google 로그인</span>
    </button>
  );
}
