
const actions = [
  { name: "Recharge", icon: "▣", color: "bg-rose-500" },
  { name: "Withdraw", icon: "⇄", color: "bg-indigo-500" },
  { name: "Service", icon: "☏", color: "bg-emerald-500" },
  { name: "Channel", icon: "➤", color: "bg-orange-500" },
];

export default function QuickActions({ onNavigate }) {
  return (
    <section className="grid grid-cols-4 gap-2 rounded-2xl bg-white p-3 shadow-sm sm:gap-4 sm:p-5">
      {actions.map((action) => (
        <button
          key={action.name}
          type="button"
          onClick={() => onNavigate(action.name)}
          className="flex min-w-0 flex-col items-center gap-2 rounded-xl px-1 py-3 transition hover:bg-slate-50 active:scale-95"
        >
          <span
            className={`${action.color} grid h-12 w-12 place-items-center rounded-2xl text-2xl font-bold text-white shadow-sm sm:h-14 sm:w-14`}
          >
            {action.icon}
          </span>

          <span className="text-center text-xs font-bold text-slate-800 sm:text-sm">
            {action.name}
          </span>
        </button>
      ))}
    </section>
  );
}
