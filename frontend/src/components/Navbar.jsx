export default function Navbar() {
  return (
    <nav className="flex h-[72px] items-center justify-between border-b border-white/10 px-5 sm:px-10 lg:px-20">
      <a href="/" className="flex items-center gap-3 text-xl font-extrabold tracking-wide">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-2xl">
          G
        </span>
        <span>
          GAME<span className="text-violet-400">ZONE</span>
        </span>
      </a>

      <span className="text-[10px] font-bold tracking-[2px] text-slate-400 sm:text-xs">
        GAMING PORTAL
      </span>
    </nav>
  );
}