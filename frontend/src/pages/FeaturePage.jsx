
import BottomNav from "../components/BottomNav";

const content = {
  Service: {
    title: "Customer Service",
    description: "Yahan website support ki information milegi.",
    icon: "🎧",
  },
  Channel: {
    title: "Official Channel",
    description: "Yahan official channel ki information ya link add kar sakte hain.",
    icon: "📢",
  },
  Share: {
    title: "Share Website",
    description: "Apni demo website ka link share karein.",
    icon: "🔗",
  },
  Team: {
    title: "My Team",
    description: "Yahan demo team aur referral details dikhengi.",
    icon: "👥",
  },
  My: {
    title: "My Account",
    description: "Yahan profile aur account settings hongi.",
    icon: "👤",
  },
};

export default function FeaturePage({ page, onNavigate }) {
  const item = content[page] || content.My;

  async function shareWebsite() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Demo Mobile Website",
          url: window.location.href,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        alert("Website link copy ho gaya.");
      } else {
        alert("Is browser mein sharing available nahi hai.");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        alert("Link share nahi ho saka.");
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f4f5] pb-24 text-slate-900">
      <header className="flex items-center gap-3 bg-[#080d5c] px-4 py-4 text-white">
        <button
          onClick={() => onNavigate("Home")}
          className="text-2xl"
          aria-label="Back home"
        >
          ←
        </button>
        <h1 className="font-bold">{item.title}</h1>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <div className="text-5xl">{item.icon}</div>
          <h2 className="mt-4 text-xl font-extrabold">{item.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {item.description}
          </p>

          {page === "Share" && (
            <button
              onClick={shareWebsite}
              className="mt-5 w-full rounded-xl bg-[#080d5c] p-3 font-semibold text-white"
            >
              Share Website
            </button>
          )}

          {page === "My" && (
            <p className="mt-5 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              Demo account · Backend abhi connected nahi hai.
            </p>
          )}

          {page === "Team" && (
            <p className="mt-5 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              Demo team: 0 members
            </p>
          )}
        </section>
      </main>

      <BottomNav active={page} onNavigate={onNavigate} />
    </div>
  );
}
