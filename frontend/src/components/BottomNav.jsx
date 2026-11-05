
const tabs = [
  { name: "Home", icon: "⌂" },
  { name: "Share", icon: "↗" },
  { name: "Team", icon: "♧" },
  { name: "My", icon: "♙" },
];

export default function BottomNav({ active = "Home", onNavigate }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-5px_20px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="mx-auto grid max-w-3xl grid-cols-4">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            type="button"
            onClick={() => onNavigate(tab.name)}
            className={`flex flex-col items-center gap-1 py-2 transition ${
              active === tab.name
                ? "text-[#080d5c]"
                : "text-slate-400 hover:text-indigo-700"
            }`}
          >
            <span className="text-3xl leading-none">{tab.icon}</span>
            <span className="text-xs font-semibold">{tab.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
