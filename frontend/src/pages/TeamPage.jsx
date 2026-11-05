
import { useState } from "react";
import BottomNav from "../components/BottomNav";

const levels = [
  { id: 1, label: "LV:1", income: "25%" },
  { id: 2, label: "LV:2", income: "3%" },
  { id: 3, label: "LV:3", income: "2%" },
];

function TeamTree() {
  return (
    <div className="overflow-hidden bg-white px-2 pb-2 pt-5">
      <svg
        viewBox="0 0 340 170"
        className="mx-auto block w-full max-w-md"
        role="img"
        aria-label="Demo team hierarchy showing a main account and team member levels"
      >
        <g fill="none" stroke="#a3a3a3" strokeWidth="2.5" strokeLinecap="round">
          <path d="M170 35 V53 H70 V69 M170 53 V69 M170 53 H270 V69" />
          <path d="M70 94 V108 H45 V126 M70 108 H95 V126" />
          <path d="M170 94 V108 H135 V126 M170 108 V126 M170 108 H205 V126" />
          <path d="M270 94 V108 H245 V126 M270 108 H295 V126" />
        </g>

        <g fill="#c52c3c">
          <circle cx="170" cy="19" r="8" />
          <path d="M155 38 Q155 29 164 29 H176 Q185 29 185 38 L193 45 H147 Z" />
        </g>

        <g fill="#2474ce">
          {[70, 170, 270].map((x) => (
            <g key={x}>
              <circle cx={x} cy="78" r="7" />
              <path d={`M${x - 15} 94 Q${x - 15} 86 ${x - 6} 86 H${x + 6} Q${x + 15} 86 ${x + 15} 94 L${x + 19} 99 H${x - 19} Z`} />
            </g>
          ))}
        </g>

        <g fill="#91bce9">
          {[45, 95, 135, 170, 205, 245, 295].map((x) => (
            <g key={x}>
              <circle cx={x} cy="136" r="6" />
              <path d={`M${x - 12} 153 Q${x - 12} 144 ${x - 4} 144 H${x + 4} Q${x + 12} 144 ${x + 12} 153 L${x + 15} 158 H${x - 15} Z`} />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

export default function TeamPage({ onNavigate }) {
  const [activeLevel, setActiveLevel] = useState(1);

  function navigateTo(destination) {
    if (onNavigate) onNavigate(destination);
  }

  const stats = [
    {
      label: "Withdrawal",
      value: "₹ 0",
      action: "Withdraw",
    },
    {
      label: "Recharge",
      value: "₹ 0",
      action: "Recharge",
    },
    {
      label: "Team Size",
      value: "0",
      action: null,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-24 text-slate-900">
      <header className="flex h-[76px] items-center justify-center bg-[#080d5c] px-4 text-white">
        <h1 className="text-xl font-bold">Team LV.{activeLevel}</h1>
      </header>

      <main className="mx-auto max-w-3xl">
        <TeamTree />

        <section className="relative z-10 -mt-1 grid grid-cols-3 gap-2 px-3">
          {stats.map((stat) => (
            <button
              key={stat.label}
              type="button"
              onClick={() => stat.action && navigateTo(stat.action)}
              className={`flex min-h-[100px] flex-col items-center justify-center rounded-2xl bg-[#080d5c] px-1 py-4 text-center text-white shadow-lg ${
                stat.action ? "active:scale-[0.98]" : "cursor-default"
              }`}
            >
              <span className="text-xs sm:text-sm">{stat.label}</span>
              <span className="mt-3 text-lg font-extrabold sm:text-xl">
                {stat.value}
              </span>
            </button>
          ))}
        </section>

        <section className="mx-3 mt-6 grid grid-cols-3 gap-1 rounded-2xl bg-[#080d5c] p-1.5">
          {levels.map((level) => (
            <button
              key={level.id}
              type="button"
              onClick={() => setActiveLevel(level.id)}
              className={`rounded-xl px-1 py-3 transition sm:py-4 ${
                activeLevel === level.id
                  ? "bg-white text-[#080d5c]"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <span className="block text-base font-extrabold sm:text-lg">
                {level.label}
              </span>
              <span className="mt-2 block text-xs sm:text-sm">
                Income {level.income}
              </span>
            </button>
          ))}
        </section>

        <section className="mx-3 mt-5 rounded-2xl bg-white px-4 py-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Level {activeLevel} Members
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Demo team overview
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              0 Members
            </span>
          </div>

          <div className="flex min-h-48 flex-col items-center justify-center py-8 text-center">
            <div className="text-5xl text-slate-300">♙</div>
            <p className="mt-4 text-2xl font-semibold tracking-wide text-slate-400">
              NO DATA
            </p>
            <p className="mt-2 text-xs text-slate-500">
              No members found in this demo level.
            </p>
          </div>
        </section>

        <p className="mx-4 mt-4 text-center text-xs leading-5 text-slate-500">
          Demo team only. Income percentages are illustrative labels, not
          promised earnings or guaranteed returns.
        </p>
      </main>

      <BottomNav active="Team" onNavigate={navigateTo} />
    </div>
  );
}
