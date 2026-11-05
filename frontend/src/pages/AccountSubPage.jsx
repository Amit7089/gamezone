import { useEffect, useMemo, useState } from "react";
import BottomNav from "../components/BottomNav";
import { getMyProfile } from "../utils/api";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const PAGE_INFO = {
  Income: {
    title: "Income",
    subtitle: "Your account overview",
    icon: "₹",
  },
  "Personal information": {
    title: "Personal Information",
    subtitle: "Your account profile",
    icon: "👤",
  },
  "Income details": {
    title: "Income Details",
    subtitle: "Income records",
    icon: "📊",
  },
  "Recharge records": {
    title: "Account Records",
    subtitle: "Recharge and payment history",
    icon: "↻",
  },
  "Withdrawal records": {
    title: "Withdrawal Records",
    subtitle: "Request and track withdrawals",
    icon: "⇄",
  },
  "About us": {
    title: "About Us",
    subtitle: "About this website",
    icon: "ⓘ",
  },
  Language: {
    title: "Language",
    subtitle: "Choose your preferred language",
    icon: "🌐",
  },
  "Log out": {
    title: "Log Out",
    subtitle: "Exit your account",
    icon: "↪",
  },
};

function getAuthHeaders() {
  const token = sessionStorage.getItem("authToken");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || data.error || `Request failed (${response.status})`
    );
  }

  return data;
}

function extractArray(data, keys) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function money(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function statusStyle(status) {
  const value = String(status || "pending").toLowerCase();

  if (["paid", "approved", "success", "completed"].includes(value)) {
    return "bg-green-100 text-green-800";
  }

  if (["rejected", "failed", "failure"].includes(value)) {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-800";
}

function statusLabel(status) {
  const value = String(status || "pending").toLowerCase();

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function AccountSubPage({
  page,
  onBack,
  onNavigate,
}) {
  const info = PAGE_INFO[page] || PAGE_INFO.Income;

  const [language, setLanguage] = useState("English");

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [rechargeRecords, setRechargeRecords] = useState([]);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");

  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");

  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState("");
  const [withdrawalSuccess, setWithdrawalSuccess] = useState("");

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("upi");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Load profile.
  useEffect(() => {
    if (page !== "Personal information" && page !== "Income") {
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      setProfileLoading(true);
      setProfileError("");

      try {
        const result = await getMyProfile();
        const profile = result?.user || result?.profile || result;

        if (!cancelled && profile && typeof profile === "object") {
          setUser(profile);
          sessionStorage.setItem("user", JSON.stringify(profile));
        }
      } catch (error) {
        if (!cancelled) {
          setProfileError(error.message || "Profile load nahi ho payi.");
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  // Load recharge and payment records.
  useEffect(() => {
    if (
      !["Income", "Income details", "Recharge records"].includes(page)
    ) {
      return;
    }

    let cancelled = false;

    async function loadRecords() {
      setRecordsLoading(true);
      setRecordsError("");

      const results = await Promise.allSettled([
        apiRequest("/recharge"),
        apiRequest("/payments/my-transactions"),
      ]);

      if (cancelled) return;

      const errors = [];

      if (results[0].status === "fulfilled") {
        setRechargeRecords(
          extractArray(results[0].value, [
            "records",
            "recharges",
            "transactions",
          ])
        );
      } else {
        setRechargeRecords([]);
        errors.push(
          `Recharge: ${results[0].reason?.message || "Load failed"}`
        );
      }

      if (results[1].status === "fulfilled") {
        setPaymentRecords(
          extractArray(results[1].value, [
            "transactions",
            "records",
            "payments",
          ])
        );
      } else {
        setPaymentRecords([]);
        errors.push(
          `Payment: ${results[1].reason?.message || "Load failed"}`
        );
      }

      if (errors.length) setRecordsError(errors.join(" | "));

      setRecordsLoading(false);
    }

    loadRecords();

    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  // Load wallet balance.
  useEffect(() => {
    if (page !== "Income" && page !== "Income details" &&
        page !== "Withdrawal records") {
      return;
    }

    let cancelled = false;

    async function loadWallet() {
      setWalletLoading(true);
      setWalletError("");

      try {
        const result = await apiRequest("/wallet/summary");

        if (!cancelled) {
          setWallet(result.wallet || result);
        }
      } catch (error) {
        if (!cancelled) {
          setWallet(null);
          setWalletError(
            error.message || "Wallet balance load nahi ho paya."
          );
        }
      } finally {
        if (!cancelled) setWalletLoading(false);
      }
    }

    loadWallet();

    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  // Load user's withdrawal history.
  useEffect(() => {
    if (page !== "Withdrawal records") return;

    let cancelled = false;

    async function loadWithdrawals() {
      setWithdrawalsLoading(true);
      setWithdrawalError("");

      try {
        const result = await apiRequest("/withdrawals/my");

        if (!cancelled) {
          const list = extractArray(result, [
            "withdrawals",
            "records",
          ]);

          setWithdrawals(
            [...list].sort(
              (a, b) =>
                new Date(b.createdAt || 0) -
                new Date(a.createdAt || 0)
            )
          );
        }
      } catch (error) {
        if (!cancelled) {
          setWithdrawals([]);
          setWithdrawalError(
            error.message || "Withdrawal history load nahi ho payi."
          );
        }
      } finally {
        if (!cancelled) setWithdrawalsLoading(false);
      }
    }

    loadWithdrawals();

    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  // Merge recharge and payment history.
  const allRecords = useMemo(() => {
    const recharges = rechargeRecords.map((record) => ({
      ...record,
      recordType: "Recharge",
      recordKey: `recharge-${record._id || record.orderId || record.createdAt}`,
    }));

    const payments = paymentRecords.map((record) => ({
      ...record,
      recordType: "Payment",
      recordKey: `payment-${record._id || record.orderReference || record.createdAt}`,
    }));

    return [...recharges, ...payments].sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    );
  }, [rechargeRecords, paymentRecords]);

  const successfulRecharges = useMemo(
    () =>
      rechargeRecords.filter(
        (record) =>
          String(record.status || "").toLowerCase() === "success"
      ),
    [rechargeRecords]
  );

  const successfulRechargeTotal = useMemo(
    () =>
      successfulRecharges.reduce(
        (total, record) => total + (Number(record.amount) || 0),
        0
      ),
    [successfulRecharges]
  );

  function refreshData() {
    setReloadKey((current) => current + 1);
  }

  function handleLogout() {
    onNavigate?.("Log out");
  }

  // Submit withdrawal request.
  async function handleWithdrawalSubmit(event) {
    event.preventDefault();

    setWithdrawalError("");
    setWithdrawalSuccess("");

    const numericAmount = Number(amount);
    const available = Number(wallet?.availableBalance ?? 0);

    if (!Number.isSafeInteger(numericAmount) || numericAmount < 1) {
      setWithdrawalError(
        "Amount whole number mein enter karein (minimum ₹1)."
      );
      return;
    }

    if (numericAmount > available) {
      setWithdrawalError(
        "Withdrawal amount available balance se zyada hai."
      );
      return;
    }

    if (accountHolderName.trim().length < 2) {
      setWithdrawalError("Account holder name enter karein.");
      return;
    }

    const accountDetails = {
      accountHolderName: accountHolderName.trim(),
    };

    if (method === "upi") {
      if (!/^[a-z0-9._-]{2,}@[a-z0-9.-]{2,}$/i.test(upiId.trim())) {
        setWithdrawalError(
          "Valid UPI ID enter karein. Example: name@upi"
        );
        return;
      }

      accountDetails.upiId = upiId.trim();
    } else {
      if (!/^[0-9]{8,18}$/.test(accountNumber.trim())) {
        setWithdrawalError(
          "Bank account number 8 se 18 digits ka hona chahiye."
        );
        return;
      }

      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.trim())) {
        setWithdrawalError("Valid IFSC code enter karein.");
        return;
      }

      if (bankName.trim().length < 2) {
        setWithdrawalError("Bank name enter karein.");
        return;
      }

      accountDetails.accountNumber = accountNumber.trim();
      accountDetails.ifscCode = ifscCode.trim().toUpperCase();
      accountDetails.bankName = bankName.trim();
    }

    setSubmitting(true);

    try {
      const result = await apiRequest("/withdrawals", {
        method: "POST",
        body: JSON.stringify({
          amount: numericAmount,
          method,
          accountDetails,
        }),
      });

      setWithdrawalSuccess(
        result.message || "Withdrawal request submit ho gayi."
      );

      setAmount("");
      setUpiId("");
      setAccountNumber("");
      setIfscCode("");
      setBankName("");

      refreshData();
    } catch (error) {
      setWithdrawalError(
        error.message || "Withdrawal request submit nahi ho payi."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Recharge/payment record card.
  function renderTransaction(record) {
    const rawStatus = String(record.status || "pending").toLowerCase();

    const status = ["success", "completed", "approved"].includes(rawStatus)
      ? "SUCCESS"
      : ["rejected", "failed", "failure"].includes(rawStatus)
        ? "FAILED"
        : "WAITING";

    const isRecharge = record.recordType === "Recharge";

    const reference = isRecharge
      ? record.orderId || record.paymentId || "Recharge"
      : record.orderReference || record.orderId || "Payment";

    const details = isRecharge
      ? [
          "Recharge",
          record.paymentMethod && `Method: ${record.paymentMethod}`,
          record.paymentId && `Payment ID: ${record.paymentId}`,
        ].filter(Boolean)
      : [
          record.purpose && `Type: ${record.purpose}`,
          record.utr && `UTR: ${record.utr}`,
          record.adminNote && `Note: ${record.adminNote}`,
        ].filter(Boolean);

    return (
      <article
        key={record.recordKey}
        className="flex min-h-[120px] items-center gap-3 rounded-2xl bg-black px-3 py-5 text-white shadow-lg sm:gap-5 sm:px-6"
      >
        <div className="w-[88px] shrink-0 sm:w-[120px]">
          <span
            className={`flex min-h-[40px] items-center justify-center rounded-lg px-2 text-[10px] font-extrabold tracking-wide sm:text-sm ${
              status === "SUCCESS"
                ? "bg-green-600"
                : status === "FAILED"
                  ? "bg-red-600"
                  : "bg-amber-500"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="break-all text-sm font-bold sm:text-base">
            {reference}
          </h3>

          <p className="mt-2 text-xs text-gray-300">
            {formatDate(record.createdAt)}
          </p>

          <p className="mt-1 text-xs font-semibold text-indigo-300">
            {record.recordType}
          </p>

          {details.map((detail) => (
            <p
              key={detail}
              className="mt-1 break-all text-xs text-gray-400"
            >
              {detail}
            </p>
          ))}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-base font-extrabold sm:text-xl">
            {money(record.amount)}
          </p>

          <p className="mt-1 text-[10px] text-gray-400 sm:text-xs">
            {status === "WAITING"
              ? "Pending review"
              : status === "SUCCESS"
                ? "Success / approved"
                : "Failed / rejected"}
          </p>
        </div>
      </article>
    );
  }

  // Recharge and payment history page.
  if (page === "Recharge records") {
    return (
      <div className="min-h-screen bg-white pb-24 text-slate-900">
        <header className="relative flex h-[76px] items-center justify-center bg-[#080d5c] px-16 text-white">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="absolute left-4 text-4xl font-light"
          >
            ‹
          </button>

          <h1 className="text-center text-xl font-bold">
            Account Records
          </h1>

          <button
            type="button"
            onClick={refreshData}
            className="absolute right-3 rounded-lg border border-white/40 px-2 py-1 text-xs"
          >
            Refresh
          </button>
        </header>

        <section className="flex h-[220px] items-center justify-center bg-gradient-to-br from-indigo-950 via-[#080d5c] to-slate-800 px-4 sm:h-[260px]">
          <div className="w-full rounded-[26px] bg-white/90 px-4 py-7 text-center shadow-lg">
            <h2 className="text-3xl font-extrabold text-black sm:text-4xl">
              Account Records
            </h2>
            <p className="mt-3 text-base text-slate-700 sm:text-xl">
              Your recharge and payment history
            </p>
          </div>
        </section>

        <main className="min-h-[400px] space-y-5 bg-white px-3 py-8 sm:px-5">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-sm text-slate-500">Total records</p>
              <p className="mt-1 text-2xl font-extrabold text-[#080d5c]">
                {allRecords.length}
              </p>
            </div>

            <button
              type="button"
              onClick={refreshData}
              className="rounded-lg bg-[#080d5c] px-4 py-2 text-sm font-semibold text-white"
            >
              Refresh records
            </button>
          </div>

          {recordsLoading && (
            <div className="rounded-xl bg-slate-50 px-4 py-12 text-center text-slate-500">
              Loading records...
            </div>
          )}

          {recordsError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Kuch records load nahi ho paaye: {recordsError}
            </div>
          )}

          {!recordsLoading && allRecords.length === 0 && (
            <div className="py-16 text-center">
              <div className="text-5xl text-slate-300">↻</div>
              <h3 className="mt-4 font-bold text-slate-500">
                NO RECORDS FOUND
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Abhi koi recharge/payment record nahi mila.
              </p>
              <button
                type="button"
                onClick={refreshData}
                className="mt-4 rounded-lg bg-[#080d5c] px-5 py-2 text-sm font-semibold text-white"
              >
                Try again
              </button>
            </div>
          )}

          {!recordsLoading && allRecords.map(renderTransaction)}

          <p className="rounded-xl bg-slate-50 p-3 text-center text-xs leading-5 text-slate-500">
            Payment status backend ke saved status ke according dikhaya
            jata hai. Submitted UTR apne aap successful payment ka proof
            nahi hai.
          </p>
        </main>

        <BottomNav active="My" onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f5] pb-24 text-slate-900">
      <header className="relative flex h-16 items-center justify-center bg-[#080d5c] px-14 text-white">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="absolute left-4 text-3xl"
        >
          ‹
        </button>

        <h1 className="text-lg font-bold">{info.title}</h1>

        <button
          type="button"
          onClick={refreshData}
          className="absolute right-3 rounded-lg border border-white/40 px-2 py-1 text-xs"
        >
          Refresh
        </button>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-3 py-5 sm:px-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-3xl text-[#080d5c]">
              {info.icon}
            </div>

            <div>
              <h2 className="text-lg font-extrabold">{info.title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {info.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* INCOME PAGE */}
        {page === "Income" && (
          <>
            <section className="rounded-2xl bg-[#080d5c] p-5 text-white">
              <p className="text-sm text-white/75">
                Available wallet balance
              </p>

              <p className="mt-2 text-3xl font-extrabold">
                {walletLoading
                  ? "Loading..."
                  : money(wallet?.availableBalance)}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/20 pt-4">
                <div>
                  <p className="text-xs text-white/70">Total balance</p>
                  <p className="mt-1 text-lg font-bold">
                    {money(wallet?.balance)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-white/70">On hold</p>
                  <p className="mt-1 text-lg font-bold">
                    {money(wallet?.heldAmount)}
                  </p>
                </div>
              </div>

              {walletError && (
                <p className="mt-3 text-xs text-amber-200">
                  {walletError}
                </p>
              )}

              <p className="mt-3 text-xs leading-5 text-white/75">
                Balance posted wallet ledger se calculate hota hai.
                Payment history ko wallet balance nahi maana jata.
              </p>

              <button
                type="button"
                onClick={() => onNavigate?.("Withdrawal records")}
                className="mt-4 w-full rounded-xl bg-white px-4 py-3 font-bold text-[#080d5c]"
              >
                Withdraw funds
              </button>
            </section>

            <section className="rounded-2xl bg-white p-5">
              <h3 className="font-bold">Recharge Summary</h3>

              {recordsLoading ? (
                <p className="mt-3 text-sm text-slate-500">
                  Loading recharge records...
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">
                      Successful recharges
                    </p>
                    <p className="mt-2 text-xl font-bold text-[#080d5c]">
                      {successfulRecharges.length}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">
                      Successful recharge total
                    </p>
                    <p className="mt-2 text-xl font-bold text-[#080d5c]">
                      {money(successfulRechargeTotal)}
                    </p>
                  </div>
                </div>
              )}

              {recordsError && (
                <p className="mt-3 text-sm text-red-600">
                  {recordsError}
                </p>
              )}

              <button
                type="button"
                onClick={() => onNavigate?.("Recharge records")}
                className="mt-4 rounded-xl bg-[#080d5c] px-4 py-3 text-sm font-semibold text-white"
              >
                View Account Records
              </button>
            </section>

            {profileLoading && (
              <p className="rounded-xl bg-white p-3 text-sm text-slate-500">
                Loading profile...
              </p>
            )}

            {profileError && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {profileError}
              </p>
            )}
          </>
        )}

        {/* WITHDRAWAL PAGE */}
        {page === "Withdrawal records" && (
          <>
            <section className="rounded-2xl bg-[#080d5c] p-5 text-white">
              <p className="text-sm text-white/75">
                Available wallet balance
              </p>

              <p className="mt-2 text-3xl font-extrabold">
                {walletLoading
                  ? "Loading..."
                  : money(wallet?.availableBalance)}
              </p>

              <div className="mt-3 flex justify-between text-xs text-white/70">
                <span>Total: {money(wallet?.balance)}</span>
                <span>On hold: {money(wallet?.heldAmount)}</span>
              </div>

              {walletError && (
                <p className="mt-3 text-sm text-amber-200">
                  {walletError}
                </p>
              )}
            </section>

            <form
              onSubmit={handleWithdrawalSubmit}
              className="space-y-4 rounded-2xl bg-white p-5 shadow-sm"
            >
              <div>
                <h2 className="text-lg font-extrabold">
                  Request Withdrawal
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Sirf eligible aur verified wallet funds ke liye
                  request karein. Minimum withdrawal ₹1 hai.
                </p>
              </div>

              <label className="block text-sm font-semibold">
                Withdrawal amount (₹)
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount in whole rupees"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#080d5c]"
                />
              </label>

              <div>
                <p className="mb-2 text-sm font-semibold">
                  Payout method
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod("upi")}
                    className={`rounded-xl border p-3 font-semibold ${
                      method === "upi"
                        ? "border-[#080d5c] bg-indigo-50 text-[#080d5c]"
                        : "border-slate-200"
                    }`}
                  >
                    UPI
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("bank")}
                    className={`rounded-xl border p-3 font-semibold ${
                      method === "bank"
                        ? "border-[#080d5c] bg-indigo-50 text-[#080d5c]"
                        : "border-slate-200"
                    }`}
                  >
                    Bank Transfer
                  </button>
                </div>
              </div>

              <label className="block text-sm font-semibold">
                Account holder name
                <input
                  type="text"
                  required
                  minLength="2"
                  maxLength="100"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Name as per bank/UPI account"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#080d5c]"
                />
              </label>

              {method === "upi" ? (
                <label className="block text-sm font-semibold">
                  UPI ID
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="example@upi"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#080d5c]"
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold">
                    Bank name
                    <input
                      type="text"
                      required
                      minLength="2"
                      maxLength="100"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Bank name"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#080d5c]"
                    />
                  </label>

                  <label className="block text-sm font-semibold">
                    Account number
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={accountNumber}
                      onChange={(e) =>
                        setAccountNumber(
                          e.target.value.replace(/\D/g, "").slice(0, 18)
                        )
                      }
                      placeholder="Bank account number"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#080d5c]"
                    />
                  </label>

                  <label className="block text-sm font-semibold">
                    IFSC code
                    <input
                      type="text"
                      required
                      maxLength="11"
                      value={ifscCode}
                      onChange={(e) =>
                        setIfscCode(e.target.value.toUpperCase())
                      }
                      placeholder="ABCD0123456"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-[#080d5c]"
                    />
                  </label>
                </div>
              )}

              {withdrawalError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {withdrawalError}
                </div>
              )}

              {withdrawalSuccess && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {withdrawalSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  submitting ||
                  walletLoading ||
                  !wallet ||
                  Number(wallet.availableBalance) <= 0
                }
                className="w-full rounded-xl bg-[#080d5c] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Withdrawal Request"}
              </button>

              <p className="text-[11px] leading-5 text-slate-500">
                Request submit hone par amount temporarily hold hoga.
                Admin review aur actual payout complete hone ke baad hi
                status Paid hoga.
              </p>
            </form>

            {/* Withdrawal history */}
            <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold">
                  Withdrawal History
                </h2>

                <button
                  type="button"
                  onClick={refreshData}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
                >
                  Refresh
                </button>
              </div>

              {withdrawalsLoading && (
                <p className="py-8 text-center text-sm text-slate-500">
                  Loading withdrawal history...
                </p>
              )}

              {withdrawalError && (
                <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {withdrawalError}
                </p>
              )}

              {!withdrawalsLoading &&
                !withdrawalError &&
                withdrawals.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Abhi koi withdrawal request nahi hai.
                  </p>
                )}

              {withdrawals.map((item) => (
                <article
                  key={item._id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-extrabold">
                        {money(item.amount)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(
                        item.status
                      )}`}
                    >
                      {statusLabel(item.status)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-semibold">
                    {item.method === "upi"
                      ? "UPI Transfer"
                      : "Bank Transfer"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Account:{" "}
                    {item.method === "upi"
                      ? item.accountDetails?.upiId || "UPI details saved"
                      : `••••${String(
                          item.accountDetails?.accountNumber || ""
                        ).slice(-4)}`}
                  </p>

                  {item.adminNote && (
                    <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                      Admin note: {item.adminNote}
                    </p>
                  )}

                  {item.payoutReference && (
                    <p className="mt-2 break-all text-xs text-slate-500">
                      Payout reference: {item.payoutReference}
                    </p>
                  )}

                  {item.paidAt && (
                    <p className="mt-1 text-xs text-green-700">
                      Paid on: {formatDate(item.paidAt)}
                    </p>
                  )}
                </article>
              ))}
            </section>
          </>
        )}

        {/* PERSONAL INFORMATION */}
        {page === "Personal information" && (
          <section className="space-y-3 rounded-2xl bg-white p-5">
            {profileError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {profileError}
              </div>
            )}

            {[
              [
                "Name",
                profileLoading ? "Loading..." : user?.name || "Not available",
              ],
              [
                "Email",
                profileLoading ? "Loading..." : user?.email || "Not available",
              ],
              [
                "Account status",
                profileLoading
                  ? "Checking..."
                  : user?.isActive === true
                    ? "Active"
                    : user?.isActive === false
                      ? "Inactive"
                      : "Not available",
              ],
              [
                "Role",
                profileLoading ? "Loading..." : user?.role || "Not available",
              ],
              [
                "Member since",
                profileLoading
                  ? "Loading..."
                  : user?.createdAt
                    ? formatDate(user.createdAt)
                    : "Not available",
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0"
              >
                <span className="text-sm text-slate-500">{label}</span>
                <span className="break-all text-right text-sm font-semibold">
                  {value}
                </span>
              </div>
            ))}
          </section>
        )}

        {/* INCOME DETAILS */}
        {page === "Income details" && (
          <section className="rounded-2xl bg-white p-5">
            <h2 className="text-lg font-bold">Income records</h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Verified income entries wallet ledger se calculate hote
              hain. Recharge aur payment records alag transaction history
              hain.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Total income</p>
                <p className="mt-2 text-lg font-bold">
                  {money(wallet?.totalIncome)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Available balance
                </p>
                <p className="mt-2 text-lg font-bold">
                  {money(wallet?.availableBalance)}
                </p>
              </div>
            </div>

            {walletError && (
              <p className="mt-3 text-sm text-red-600">{walletError}</p>
            )}

            <button
              type="button"
              onClick={() => onNavigate?.("Withdrawal records")}
              className="mt-4 rounded-xl bg-[#080d5c] px-4 py-3 text-sm font-semibold text-white"
            >
              View Withdrawals
            </button>
          </section>
        )}

        {/* ABOUT */}
        {page === "About us" && (
          <section className="rounded-2xl bg-white p-5">
            <h2 className="text-lg font-bold">Welcome to GameZone</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Account records connected backend APIs se load hote hain.
              Wallet balance posted ledger se calculate hota hai.
              Withdrawals admin review aur actual payout verification ke
              baad complete hote hain.
            </p>
          </section>
        )}

        {/* LANGUAGE */}
        {page === "Language" && (
          <section className="space-y-3 rounded-2xl bg-white p-4">
            <p className="mb-2 text-sm text-slate-500">
              Select a language:
            </p>

            {["English", "Hindi"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLanguage(item)}
                className={`flex w-full items-center justify-between rounded-xl border p-4 ${
                  language === item
                    ? "border-[#080d5c] bg-indigo-50 text-[#080d5c]"
                    : "border-slate-200"
                }`}
              >
                <span className="font-semibold">{item}</span>
                <span>{language === item ? "✓" : ""}</span>
              </button>
            ))}

            <p className="text-xs leading-5 text-slate-500">
              Language selection abhi setting badalti hai; poori website
              ka translation alag se implement karna hoga.
            </p>
          </section>
        )}

        {/* LOGOUT */}
        {page === "Log out" && (
          <section className="rounded-2xl bg-white p-5 text-center">
            <div className="text-5xl">↪</div>

            <h2 className="mt-4 text-xl font-bold">
              Log out of your account?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              You will return to the login screen.
            </p>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-5 w-full rounded-xl bg-[#080d5c] p-3 font-semibold text-white"
            >
              Confirm Logout
            </button>
          </section>
        )}
      </main>

      <BottomNav active="My" onNavigate={onNavigate} />
    </div>
  );
}