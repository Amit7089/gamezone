
import { useCallback, useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import { getMyProfile } from "../utils/api";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const menuItems = [
  { name: "Income", icon: "♙", description: "Your income summary" },
  { name: "Personal information", icon: "▤", description: "Your profile details" },
  { name: "Income details", icon: "▧", description: "Income history" },
  { name: "Recharge records", icon: "▱", description: "Recharge history" },
  { name: "Withdrawal records", icon: "▰", description: "Withdrawal history" },
  { name: "About us", icon: "ⓘ", description: "About this website" },
  { name: "Language", icon: "◎", description: "Choose language" },
  { name: "Log out", icon: "⏻", description: "Log out of your account" },
];

function money(value) {
  const amount = Number(value);

  if (value === null || value === undefined || value === "") {
    return "Unavailable";
  }

  if (!Number.isFinite(amount)) return "Unavailable";

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getAuthHeaders() {
  const token = sessionStorage.getItem("authToken");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchWalletSummary() {
  const response = await fetch(`${API_URL}/wallet/summary`, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Wallet API failed (${response.status})`
    );
  }

  // Accept either { summary: {...} } or a direct summary object.
  return data.summary || data.wallet || data;
}

export default function MyPage({ onNavigate }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [wallet, setWallet] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [walletError, setWalletError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(async () => {
    setProfileLoading(true);
    setWalletLoading(true);
    setProfileError("");
    setWalletError("");

    const [profileResult, walletResult] = await Promise.allSettled([
      getMyProfile(),
      fetchWalletSummary(),
    ]);

    if (profileResult.status === "fulfilled") {
      const result = profileResult.value;
      const profile = result?.user || result?.profile || result;

      if (profile && typeof profile === "object") {
        setUser(profile);
        sessionStorage.setItem("user", JSON.stringify(profile));
      }
    } else {
      setProfileError(
        profileResult.reason?.message || "Profile load nahi ho payi."
      );
    }

    if (walletResult.status === "fulfilled") {
      setWallet(walletResult.value);
    } else {
      setWallet(null);
      setWalletError(
        walletResult.reason?.message ||
          "Wallet summary abhi available nahi hai."
      );
    }

    setProfileLoading(false);
    setWalletLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";
  const vipLevel = user?.vipLevel ?? user?.vip ?? null;

  // These values must come from a trusted backend wallet summary.
  const balance = wallet?.balance;
  const available = wallet?.availableBalance ?? wallet?.available;
  const totalIncome = wallet?.totalIncome;

  const summaryItems = [
    { label: "Balance", value: balance },
    { label: "Available", value: available },
    { label: "Total income", value: totalIncome },
  ];

  return (
    <div className="min-h-screen bg-[#f4f4f5] pb-24 text-slate-900">
      <main className="mx-auto max-w-3xl">
        {/* Profile banner */}
        <section className="relative overflow-hidden bg-gradient-to-r from-[#080d5c] via-indigo-800 to-sky-700 px-4 pb-12 pt-7 text-white">
          <div className="absolute -right-10 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 right-20 h-24 w-24 rounded-full bg-sky-300/20 blur-2xl" />

          <div className="relative flex items-center gap-3">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-white/70 bg-white text-3xl text-[#080d5c] shadow-lg">
              👤
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="break-words text-lg font-extrabold">
                {profileLoading ? "Loading profile..." : displayName}
              </h1>

              <p className="mt-1 break-all text-sm tracking-wide">
                {displayEmail ||
                  (profileLoading
                    ? "Fetching account details..."
                    : "Email unavailable")}
              </p>

              <span className="mt-2 inline-block rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold">
                {profileLoading ? "LOADING" : "REGISTERED ACCOUNT"}
              </span>
            </div>

            <span className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs">
              VIP {vipLevel === null ? "—" : vipLevel}
            </span>
          </div>
        </section>

        {profileError && (
          <div
            role="alert"
            className="mx-3 mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
          >
            {profileError}
          </div>
        )}

        {/* Dynamic wallet summary */}
        <section className="relative z-10 mx-3 -mt-7 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl bg-white px-1 py-5 shadow-sm">
          {summaryItems.map((item) => (
            <div key={item.label} className="min-w-0 px-1 text-center">
              <p className="break-words text-sm font-extrabold text-[#080d5c] sm:text-lg">
                {walletLoading ? "Loading..." : money(item.value)}
              </p>

              <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">
                {item.label}
              </p>
            </div>
          ))}
        </section>

        {walletError && (
          <div
            role="status"
            className="mx-3 mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"
          >
            Wallet data load nahi hua: {walletError}
            <p className="mt-1">
              Backend mein authenticated GET /api/wallet/summary endpoint
              configure hona chahiye.
            </p>

            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              className="mt-2 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Refresh account information */}
        <div className="flex justify-end px-3 pt-3">
          <button
            type="button"
            disabled={profileLoading || walletLoading}
            onClick={() => setRefreshKey((value) => value + 1)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-[#080d5c] disabled:opacity-50"
          >
            {profileLoading || walletLoading ? "Refreshing..." : "Refresh account"}
          </button>
        </div>

        {/* Account menu */}
        <section className="space-y-2 px-3 pt-4">
          {menuItems.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => onNavigate?.(item.name)}
              className="flex min-h-[58px] w-full items-center gap-3 rounded-xl border border-slate-100 bg-[#e8e9ee] px-3 py-3 text-left transition hover:bg-white active:scale-[0.99]"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xl text-[#080d5c]">
                {item.icon}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-slate-800 sm:text-sm">
                  {item.name}
                </span>

                <span className="mt-1 block text-[10px] text-slate-500">
                  {item.description}
                </span>
              </span>

              <span className="text-xl text-slate-400">›</span>
            </button>
          ))}
        </section>

        <p className="px-5 py-5 text-center text-[11px] leading-5 text-slate-500">
          Profile and wallet information are requested from authenticated
          backend APIs. Wallet values are shown only when returned by the API.
        </p>
      </main>

      <BottomNav active="My" onNavigate={onNavigate} />
    </div>
  );
}
