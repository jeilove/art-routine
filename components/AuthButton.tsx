import { signIn, signOut, useSession } from "next-auth/react"
import { LogIn, LogOut, User } from "lucide-react"

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />;

  if (session) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 p-1 pr-2 sm:pr-2.5 rounded-full border border-white/10 backdrop-blur-sm">
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-linear-to-br from-[#d66d5c] to-[#c5a454] flex items-center justify-center overflow-hidden border border-white/20 shrink-0">
          {session.user?.image ? (
            <img 
              src={session.user.image} 
              alt="" 
              className="w-full h-full object-cover" 
              onError={(e) => (e.currentTarget.style.display = 'none')} 
            />
          ) : (
            <User size={12} className="text-white" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
            <span className="hidden sm:block text-[8px] text-[#c5a454] uppercase font-bold tracking-tighter leading-none mb-0.5">Creator</span>
            <span className="text-[9px] sm:text-[10px] font-bold text-white/90 leading-tight truncate max-w-[40px] sm:max-w-[50px]">{session.user?.name}</span>
        </div>
        <button 
          onClick={() => signOut()}
          className="p-1 hover:bg-white/10 rounded-full transition-colors shrink-0"
          title="로그아웃"
        >
          <LogOut size={10} className="text-white/30 hover:text-white/60 sm:size-[12px]" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white rounded-full text-[11px] font-bold hover:bg-white/20 transition-all border border-white/10 shadow-lg"
    >
      <LogIn size={14} />
      <span>로그인</span>
    </button>
  );
}
