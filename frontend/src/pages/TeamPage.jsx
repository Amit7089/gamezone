
import { useCallback, useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

function formatDate(date) {
  if (!date) return "Date unavailable";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

async function referralRequest(endpoint) {
  const token = sessionStorage.getItem("authToken");

  if (!token) {
    throw new Error("Please login again to view your referral team.");
  }

  const response = await fetch(`${API_URL}/referrals/${endpoint}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Unable to load referral details.");
  }

  return result;
}

export default function TeamPage({ onNavigate }) {
  const [referral, setReferral] = useState(null);
  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const navigateTo = (destination) => {
    if (onNavigate) onNavigate(destination);
  };

  const loadReferralData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [referralResult, teamResult, earningsResult] =
        await Promise.all([
          referralRequest("me"),
          referralRequest("team"),
          referralRequest("earnings"),
        ]);

      setReferral({
        referralCode: referralResult.referralCode || "",
        referralLink: referralResult.referralLink || "",
      });

      setMembers(
        Array.isArray(teamResult.members) ? teamResult.members : []
      );

      setTotalMembers(
        Number(teamResult.pagination?.total ?? teamResult.members?.length ?? 0)
      );

      setTotalCommission(Number(earningsResult.totalCommission || 0));
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferralData();
  }, [loadReferralData]);

  async function copyText(value) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy nahi ho paya. Link ko manually copy karein.");
    }
  }

  async function shareReferralLink() {
    if (!referral?.referralLink) return;

    const shareData = {
      title: "Join GameZone",
      text: `Join GameZone using my referral link. Let's start gaming together!`,
      url: referral.referralLink,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyText(referral.referralLink);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Referral link share nahi ho paya.");
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-28 text-slate-900">
      {/* HEADER */}
      <header className="bg-[#080d5c] px-4 py-6 text-center text-white">
        <h1 className="text-2xl font-extrabold">My Referral Team</h1>
        <p className="mt-1 text-xs text-blue-200">
          Invite friends and earn 4% referral commission
        </p>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-3 pt-5">
        {/* ERROR */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
          >
            {error}

            <button
              type="button"
              onClick={loadReferralData}
              className="ml-2 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* REFERRAL STATS */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#080d5c] p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-200">
                Total Team
              </span>
              <span className="text-xl">👥</span>
            </div>

            <p className="mt-3 text-3xl font-extrabold">
              {loading ? "..." : totalMembers}
            </p>

            <p className="mt-1 text-[11px] text-blue-200">
              Direct members
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Referral Income
              </span>
              <span className="text-xl">💰</span>
            </div>

            <p className="mt-3 text-2xl font-extrabold text-green-600">
              ₹{loading ? "..." : formatMoney(totalCommission)}
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              Total credited commission
            </p>
          </div>
        </section>

        {/* REFERRAL CODE CARD */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#080d5c] to-[#282b91] p-4 text-white">
            <p className="text-xs font-semibold text-blue-200">
              YOUR REFERRAL CODE
            </p>

            <div className="mt-2 flex items-center justify-between gap-2">
              <h2 className="break-all text-2xl font-extrabold tracking-wider">
                {loading ? "Loading..." : referral?.referralCode || "Not available"}
              </h2>

              <button
                type="button"
                onClick={() => copyText(referral?.referralCode)}
                disabled={!referral?.referralCode || loading}
                className="shrink-0 rounded-lg bg-white/15 px-3 py-2 text-xs font-bold hover:bg-white/25 disabled:opacity-50"
              >
                <span className="flex items-center gap-1">
                  {copied ? "✓ Copied" : "Copy"}
                </span>
              </button>
            </div>
          </div>

          <div className="p-4">
            <p className="text-xs font-semibold text-slate-600">
              YOUR REFERRAL LINK
            </p>

            <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="min-w-0 flex-1 break-all text-xs text-slate-600">
                {loading
                  ? "Loading referral link..."
                  : referral?.referralLink || "Referral link unavailable"}
              </p>

              <button
                type="button"
                onClick={() => copyText(referral?.referralLink)}
                disabled={!referral?.referralLink || loading}
                className="shrink-0 rounded-lg bg-[#080d5c] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                Copy Link
              </button>
            </div>

            <button
              type="button"
              onClick={shareReferralLink}
              disabled={!referral?.referralLink || loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              <span>↗</span>
              Share Referral Link
            </button>
          </div>
        </section>

        {/* COMMISSION INFORMATION */}
        <section className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl">
              🎯
            </div>

            <div>
              <h3 className="font-bold text-green-800">
                Earn 4% Commission
              </h3>

              <p className="mt-1 text-xs leading-5 text-green-700">
                Jab aapke referral se registered user website par
                product purchase karega, eligible purchase amount ka
                4% commission aapke wallet mein credit hoga.
              </p>
            </div>
          </div>
        </section>

        {/* TEAM MEMBERS */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">
                My Team Members
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Users registered with your referral code
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#080d5c]">
              {loading ? "..." : `${totalMembers} Members`}
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#080d5c]" />
              <p className="text-xs text-slate-500">
                Loading your team...
              </p>
            </div>
          ) : members.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center px-5 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
                👥
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-700">
                No Members Yet
              </h3>

              <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                Abhi tak kisi ne aapke referral code se registration
                nahi kiya hai. Apna referral link friends ke saath share karein.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-[#080d5c]">
                    {(member.name || "U").charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-slate-800">
                      {member.name || "GameZone User"}
                    </h3>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Joined: {formatDate(member.joinedAt)}
                    </p>

                    {member.referralCodeUsed && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        Code: {member.referralCodeUsed}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700">
                    Joined
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* REFRESH */}
        <button
          type="button"
          onClick={loadReferralData}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-[#080d5c] transition hover:bg-slate-50 disabled:opacity-50"
        >
          <span>↻</span>
          Refresh Team Details
        </button>

        <p className="px-3 text-center text-[10px] leading-5 text-slate-400">
          Referral commission is calculated on eligible product purchases.
          Only valid direct referrals are counted.
        </p>
      </main>

      <BottomNav active="Team" onNavigate={navigateTo} />
    </div>
  );
}
