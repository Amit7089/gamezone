import { useCallback, useEffect, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

async function adminRequest(path, options = {}) {
  const token = sessionStorage.getItem("authToken");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

const inputClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500";

const buttonClass =
  "rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const dateText = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("Overview");

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [busyUser, setBusyUser] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [paymentSettings, setPaymentSettings] = useState({
    upiId: "",
    payeeName: "",
    qrImageUrl: "",
    instructions:
      "Payment karne ke baad apna UTR/reference number submit karein.",
    isEnabled: false,
  });

  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [transactionStatus, setTransactionStatus] = useState("pending");
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [busyTransaction, setBusyTransaction] = useState("");
  const [notes, setNotes] = useState({});

  // Withdrawal management
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalStatus, setWithdrawalStatus] = useState("pending");
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [busyWithdrawal, setBusyWithdrawal] = useState("");
  const [withdrawalNotes, setWithdrawalNotes] = useState({});
  const [payoutReferences, setPayoutReferences] = useState({});

  // Dashboard statistics and users
  const loadDashboard = useCallback(async (page = 1, term = "") => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "10",
        search: term,
      });

      const [dashboardData, usersData] = await Promise.all([
        adminRequest("/admin/dashboard"),
        adminRequest(`/admin/users?${query.toString()}`),
      ]);

      setStats(dashboardData.stats || {});
      setUsers(usersData.users || []);

      setPagination(
        usersData.pagination || {
          page: 1,
          pages: 1,
          total: 0,
        }
      );
    } catch (err) {
      setError(err.message || "Dashboard load nahi hua.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load payment settings
  const loadPaymentSettings = useCallback(async () => {
    setSettingsLoading(true);
    setError("");

    try {
      const data = await adminRequest("/payments/admin/settings");

      if (data.settings) {
        setPaymentSettings({
          upiId: data.settings.upiId || "",
          payeeName: data.settings.payeeName || "",
          qrImageUrl: data.settings.qrImageUrl || "",
          instructions: data.settings.instructions || "",
          isEnabled: Boolean(data.settings.isEnabled),
        });
      }
    } catch (err) {
      setError(err.message || "Payment settings load nahi hui.");
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // Load payment transactions
  const loadTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({
        page: "1",
        limit: "50",
      });

      const data = await adminRequest(
        `/payments/admin/transactions?${query.toString()}`
      );

      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err.message || "Transactions load nahi hui.");
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  // Load withdrawal requests
  const loadWithdrawals = useCallback(async () => {
    setWithdrawalsLoading(true);
    setError("");

    try {
      const data = await adminRequest("/admin/withdrawals");

      setWithdrawals(data.withdrawals || []);
    } catch (err) {
      setError(err.message || "Withdrawals load nahi hui.");
    } finally {
      setWithdrawalsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(1, "");
  }, [loadDashboard]);

  useEffect(() => {
    if (activeTab === "Payment Settings") {
      loadPaymentSettings();
    }

    if (activeTab === "Transactions") {
      loadTransactions();
    }

    if (activeTab === "Withdrawals") {
      loadWithdrawals();
    }
  }, [
    activeTab,
    loadPaymentSettings,
    loadTransactions,
    loadWithdrawals,
  ]);

  // User search
  async function handleSearch(event) {
    event.preventDefault();

    const term = searchInput.trim();

    setSearch(term);

    await loadDashboard(1, term);
  }

  // User pagination
  async function changePage(nextPage) {
    if (
      nextPage < 1 ||
      nextPage > pagination.pages ||
      loading
    ) {
      return;
    }

    await loadDashboard(nextPage, search);
  }

  // Activate / deactivate user
  async function toggleUser(user) {
    if (user.role === "admin") {
      setError("Admin account ka status yahan change nahi kar sakte.");
      return;
    }

    const nextStatus = !user.isActive;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } ${user.name}?`
    );

    if (!confirmed) return;

    setBusyUser(user._id);
    setError("");
    setNotice("");

    try {
      const result = await adminRequest(
        `/admin/users/${user._id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive: nextStatus }),
        }
      );

      setNotice(result.message || "User status updated.");

      await loadDashboard(pagination.page, search);
    } catch (err) {
      setError(err.message || "User status update nahi hua.");
    } finally {
      setBusyUser("");
    }
  }

  // Save UPI / QR settings
  async function savePaymentSettings(event) {
    event.preventDefault();

    setSettingsSaving(true);
    setError("");
    setNotice("");

    try {
      const data = await adminRequest("/payments/admin/settings", {
        method: "PUT",
        body: JSON.stringify(paymentSettings),
      });

      if (data.settings) {
        setPaymentSettings((old) => ({
          ...old,
          ...data.settings,
        }));
      }

      setNotice(data.message || "Payment settings save ho gayi.");
    } catch (err) {
      setError(err.message || "Settings save nahi hui.");
    } finally {
      setSettingsSaving(false);
    }
  }

  // Approve / reject transaction
  async function reviewTransaction(transaction, status) {
    if (transaction.status !== "pending") {
      setError("Ye transaction pehle hi review ho chuki hai.");
      return;
    }

    const note = (notes[transaction._id] || "").trim();

    if (status === "rejected" && !note) {
      setError("Reject karne ke liye admin note/reason likhein.");
      return;
    }

    const action = status === "approved" ? "approve" : "reject";

    const confirmed = window.confirm(
      `${action === "approve" ? "Approve" : "Reject"} this transaction? Actual bank/UPI payment verify karna zaroori hai.`
    );

    if (!confirmed) return;

    setBusyTransaction(transaction._id);
    setError("");
    setNotice("");

    try {
      const data = await adminRequest(
        `/payments/admin/transactions/${transaction._id}/review`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
            adminNote: note,
          }),
        }
      );

      setNotice(data.message || `Transaction ${status}.`);

      await loadTransactions();
    } catch (err) {
      setError(err.message || "Transaction review nahi hua.");
    } finally {
      setBusyTransaction("");
    }
  }

  // Admin: approve or reject a pending withdrawal request.
  async function reviewWithdrawalRequest(withdrawal, status) {
    if (withdrawal.status !== "pending") {
      setError("Ye withdrawal pehle hi review ho chuki hai.");
      return;
    }

    const note = (withdrawalNotes[withdrawal._id] || "").trim();

    if (status === "rejected" && !note) {
      setError("Reject karne ke liye reason likhein.");
      return;
    }

    const confirmed = window.confirm(
      `${status === "approved" ? "Approve" : "Reject"} this withdrawal request?`
    );

    if (!confirmed) return;

    setBusyWithdrawal(withdrawal._id);
    setError("");
    setNotice("");

    try {
      const data = await adminRequest(
        `/admin/withdrawals/${withdrawal._id}/review`,
        {
          method: "PATCH",
          body: JSON.stringify({ status, adminNote: note }),
        }
      );

      setNotice(data.message || `Withdrawal ${status}.`);

      await loadWithdrawals();
    } catch (err) {
      setError(err.message || "Withdrawal review failed.");
    } finally {
      setBusyWithdrawal("");
    }
  }

  // Record payout only after actual bank/UPI transfer succeeds.
  async function markWithdrawalAsPaid(withdrawal) {
    const payoutReference = (
      payoutReferences[withdrawal._id] || ""
    ).trim();

    if (payoutReference.length < 6 || payoutReference.length > 100) {
      setError(
        "Valid payout UTR/reference enter karein (6-100 characters)."
      );
      return;
    }

    const confirmed = window.confirm(
      "Kya actual bank/UPI payout successfully complete ho gaya hai?"
    );

    if (!confirmed) return;

    setBusyWithdrawal(withdrawal._id);
    setError("");
    setNotice("");

    try {
      const data = await adminRequest(
        `/admin/withdrawals/${withdrawal._id}/paid`,
        {
          method: "PATCH",
          body: JSON.stringify({ payoutReference }),
        }
      );

      setNotice(data.message || "Withdrawal marked as paid.");

      await loadWithdrawals();
    } catch (err) {
      setError(err.message || "Payout update failed.");
    } finally {
      setBusyWithdrawal("");
    }
  }

  // Client-side filtering
  const filteredTransactions =
    transactionStatus === "all"
      ? transactions
      : transactions.filter(
          (transaction) => transaction.status === transactionStatus
        );

  const filteredWithdrawals =
    withdrawalStatus === "all"
      ? withdrawals
      : withdrawals.filter(
          (item) => item.status === withdrawalStatus
        );

  const tabs = [
    "Overview",
    "Users",
    "Payment Settings",
    "Transactions",
    "Withdrawals",
  ];

  const statCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers,
      icon: "👥",
    },
    {
      label: "Active Users",
      value: stats?.activeUsers,
      icon: "✓",
    },
    {
      label: "Inactive Users",
      value: stats?.inactiveUsers,
      icon: "⊘",
    },
    {
      label: "Admin Accounts",
      value: stats?.adminUsers,
      icon: "♙",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold tracking-[3px] text-violet-400">
              GAMEZONE / CONTROL CENTER
            </p>

            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              Admin Dashboard
            </h1>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className={`${buttonClass} border border-white/10 hover:bg-white/10`}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
          >
            {error}

            {(error.toLowerCase().includes("admin") ||
              error.toLowerCase().includes("access")) && (
              <p className="mt-2">
                Check karein ki account ka role database mein admin hai.
              </p>
            )}
          </div>
        )}

        {/* Success */}
        {notice && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
          >
            {notice}
          </div>
        )}

        {/* Navigation */}
        <nav className="mb-7 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-slate-900 p-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setError("");
                setNotice("");
              }}
              className={`${buttonClass} ${
                activeTab === tab
                  ? "bg-violet-600 text-white"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Overview and Users */}
        {(activeTab === "Overview" || activeTab === "Users") && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => (
                <article
                  key={card.label}
                  className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-lg shadow-black/10"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                      {card.label}
                    </p>

                    <span className="text-xl text-violet-300">
                      {card.icon}
                    </span>
                  </div>

                  <p className="mt-4 text-3xl font-extrabold">
                    {loading ? "..." : card.value ?? "—"}
                  </p>
                </article>
              ))}
            </section>

            {/* Overview welcome panel */}
            {activeTab === "Overview" && (
              <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
                <h2 className="text-xl font-bold">
                  Welcome to GameZone Control Center
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  Yahan se user accounts, UPI payment instructions aur
                  submitted transaction references manage kar sakte hain.
                  Approval se pehle apne bank/UPI account mein actual
                  payment credit verify karein.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("Users")}
                    className={`${buttonClass} bg-violet-600 hover:bg-violet-500`}
                  >
                    Manage Users
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("Payment Settings")}
                    className={`${buttonClass} border border-white/10 hover:bg-white/5`}
                  >
                    Payment Settings
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("Transactions")}
                    className={`${buttonClass} border border-white/10 hover:bg-white/5`}
                  >
                    View Transactions
                  </button>
                </div>
              </section>
            )}

            {/* Users table */}
            {activeTab === "Users" && (
              <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">
                      User Management
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Search accounts and manage user access.
                    </p>
                  </div>

                  <form
                    onSubmit={handleSearch}
                    className="flex w-full gap-2 sm:max-w-md"
                  >
                    <input
                      value={searchInput}
                      onChange={(event) =>
                        setSearchInput(event.target.value)
                      }
                      maxLength={100}
                      placeholder="Search name or email..."
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-violet-500"
                    />

                    <button
                      type="submit"
                      disabled={loading}
                      className={`${buttonClass} bg-violet-600 hover:bg-violet-500`}
                    >
                      Search
                    </button>
                  </form>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-950/60 text-slate-400">
                      <tr>
                        <th className="px-5 py-4">User</th>
                        <th className="px-5 py-4">Role</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Joined</th>
                        <th className="px-5 py-4">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/5">
                      {users.map((user) => (
                        <tr
                          key={user._id}
                          className="hover:bg-white/[0.02]"
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold">{user.name}</p>

                            <p className="mt-1 text-xs text-slate-400">
                              {user.email}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs capitalize text-violet-300">
                              {user.role}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs ${
                                user.isActive
                                  ? "bg-emerald-500/10 text-emerald-300"
                                  : "bg-red-500/10 text-red-300"
                              }`}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-slate-400">
                            {dateText(user.createdAt)}
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              disabled={
                                busyUser === user._id ||
                                user.role === "admin"
                              }
                              onClick={() => toggleUser(user)}
                              className={`${buttonClass} ${
                                user.isActive
                                  ? "bg-red-500/10 text-red-300 hover:bg-red-500/20"
                                  : "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                              }`}
                            >
                              {busyUser === user._id
                                ? "Saving..."
                                : user.isActive
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>
                          </td>
                        </tr>
                      ))}

                      {!loading && users.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-5 py-12 text-center text-slate-400"
                          >
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-400">
                    {loading
                      ? "Loading users..."
                      : `Total ${pagination.total || 0} users · Page ${
                          pagination.page || 1
                        } of ${pagination.pages || 1}`}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        changePage(pagination.page - 1)
                      }
                      disabled={loading || pagination.page <= 1}
                      className={`${buttonClass} border border-white/10 hover:bg-white/5`}
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        changePage(pagination.page + 1)
                      }
                      disabled={
                        loading ||
                        pagination.page >= pagination.pages
                      }
                      className={`${buttonClass} border border-white/10 hover:bg-white/5`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* Payment Settings */}
        {activeTab === "Payment Settings" && (
          <section className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-xl font-bold">
                UPI / QR Payment Settings
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                Ye settings legitimate products/services ke payments ke
                liye hain.
              </p>
            </div>

            {settingsLoading ? (
              <p className="text-sm text-slate-400">
                Loading settings...
              </p>
            ) : (
              <form
                onSubmit={savePaymentSettings}
                className="grid gap-5 md:grid-cols-2"
              >
                <label className="block text-sm font-semibold text-slate-200">
                  UPI ID

                  <input
                    required
                    maxLength={100}
                    value={paymentSettings.upiId}
                    onChange={(event) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        upiId: event.target.value,
                      })
                    }
                    placeholder="yourname@upi"
                    className={inputClass}
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-200">
                  Payee / Business Name

                  <input
                    required
                    maxLength={100}
                    value={paymentSettings.payeeName}
                    onChange={(event) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        payeeName: event.target.value,
                      })
                    }
                    placeholder="Business name"
                    className={inputClass}
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-200 md:col-span-2">
                  QR Image URL (optional)

                  <input
                    type="url"
                    maxLength={2048}
                    value={paymentSettings.qrImageUrl}
                    onChange={(event) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        qrImageUrl: event.target.value,
                      })
                    }
                    placeholder="https://example.com/your-qr.png"
                    className={inputClass}
                  />

                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    Public HTTPS image URL use karein.
                  </span>
                </label>

                {paymentSettings.qrImageUrl && (
                  <div className="md:col-span-2">
                    <p className="mb-2 text-sm text-slate-400">
                      QR preview
                    </p>

                    <img
                      src={paymentSettings.qrImageUrl}
                      alt="UPI QR preview"
                      className="max-h-64 rounded-xl bg-white p-3"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}

                <label className="block text-sm font-semibold text-slate-200 md:col-span-2">
                  Payment Instructions

                  <textarea
                    maxLength={500}
                    rows={3}
                    value={paymentSettings.instructions}
                    onChange={(event) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        instructions: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 p-4 text-sm md:col-span-2">
                  <input
                    type="checkbox"
                    checked={paymentSettings.isEnabled}
                    onChange={(event) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        isEnabled: event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-violet-500"
                  />

                  <span>
                    <span className="block font-semibold">
                      Enable payment instructions
                    </span>

                    <span className="mt-1 block text-xs text-slate-500">
                      Off karne par public payment settings hidden rahengi.
                    </span>
                  </span>
                </label>

                <div className="md:col-span-2">
                  <button
                    disabled={settingsSaving}
                    type="submit"
                    className={`${buttonClass} bg-violet-600 px-6 py-3 hover:bg-violet-500`}
                  >
                    {settingsSaving
                      ? "Saving..."
                      : "Save Payment Settings"}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* Transactions */}
        {activeTab === "Transactions" && (
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Payment Reference Review
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Approve only after verifying the actual payment receipt.
                </p>
              </div>

              <div className="flex gap-2">
                <select
                  value={transactionStatus}
                  onChange={(event) =>
                    setTransactionStatus(event.target.value)
                  }
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All statuses</option>
                </select>

                <button
                  type="button"
                  onClick={loadTransactions}
                  disabled={transactionsLoading}
                  className={`${buttonClass} border border-white/10 hover:bg-white/5`}
                >
                  {transactionsLoading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>

            {transactionsLoading ? (
              <p className="p-8 text-sm text-slate-400">
                Loading transactions...
              </p>
            ) : filteredTransactions.length === 0 ? (
              <p className="p-10 text-center text-sm text-slate-400">
                No transactions in this filter.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="bg-slate-950/60 text-slate-400">
                    <tr>
                      <th className="px-5 py-4">Customer</th>
                      <th className="px-5 py-4">Order / Purpose</th>
                      <th className="px-5 py-4">Amount</th>
                      <th className="px-5 py-4">UTR / Reference</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Review</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx._id} className="align-top">
                        <td className="px-5 py-4">
                          <p className="font-semibold">
                            {tx.user?.name || "Unknown user"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {tx.user?.email || ""}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {dateText(tx.createdAt)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p>{tx.orderReference}</p>

                          <p className="mt-1 text-xs text-slate-400">
                            {tx.purpose}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-bold">
                          {money(tx.amount)}
                        </td>

                        <td className="px-5 py-4 font-mono text-xs">
                          {tx.utr}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs capitalize ${
                              tx.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-300"
                                : tx.status === "rejected"
                                  ? "bg-red-500/10 text-red-300"
                                  : "bg-amber-500/10 text-amber-300"
                            }`}
                          >
                            {tx.status}
                          </span>

                          {tx.adminNote && (
                            <p className="mt-2 max-w-48 text-xs text-slate-400">
                              Note: {tx.adminNote}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {tx.status === "pending" ? (
                            <div className="min-w-52 space-y-2">
                              <input
                                value={notes[tx._id] || ""}
                                onChange={(event) =>
                                  setNotes((old) => ({
                                    ...old,
                                    [tx._id]: event.target.value,
                                  }))
                                }
                                maxLength={500}
                                placeholder="Admin note / reason"
                                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-violet-500"
                              />

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={
                                    busyTransaction === tx._id
                                  }
                                  onClick={() =>
                                    reviewTransaction(tx, "approved")
                                  }
                                  className={`${buttonClass} bg-emerald-500/10 px-3 py-2 text-emerald-300 hover:bg-emerald-500/20`}
                                >
                                  {busyTransaction === tx._id
                                    ? "Saving..."
                                    : "Approve"}
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    busyTransaction === tx._id
                                  }
                                  onClick={() =>
                                    reviewTransaction(tx, "rejected")
                                  }
                                  className={`${buttonClass} bg-red-500/10 px-3 py-2 text-red-300 hover:bg-red-500/20`}
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">
                              Reviewed {dateText(tx.reviewedAt)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Withdrawal Management */}
        {activeTab === "Withdrawals" && (
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Withdrawal Management
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Review UPI and bank withdrawal requests.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={withdrawalStatus}
                  onChange={(event) =>
                    setWithdrawalStatus(event.target.value)
                  }
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="paid">Paid</option>
                  <option value="all">All statuses</option>
                </select>

                <button
                  type="button"
                  onClick={loadWithdrawals}
                  disabled={withdrawalsLoading}
                  className={`${buttonClass} border border-white/10 hover:bg-white/5`}
                >
                  {withdrawalsLoading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>

            {withdrawalsLoading ? (
              <p className="p-8 text-center text-slate-400">
                Loading withdrawals...
              </p>
            ) : filteredWithdrawals.length === 0 ? (
              <p className="p-10 text-center text-sm text-slate-400">
                No withdrawal requests found.
              </p>
            ) : (
              <div className="space-y-4 p-4 sm:p-5">
                {filteredWithdrawals.map((item) => (
                  <article
                    key={item._id}
                    className="rounded-2xl border border-white/10 bg-slate-950 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">
                          {item.user?.name || "Unknown user"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {item.user?.email || ""}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {dateText(item.createdAt)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          item.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-300"
                            : item.status === "rejected"
                              ? "bg-red-500/10 text-red-300"
                              : item.status === "approved"
                                ? "bg-blue-500/10 text-blue-300"
                                : "bg-amber-500/10 text-amber-300"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white/5 p-3">
                        <p className="text-xs text-slate-400">
                          Amount
                        </p>

                        <p className="mt-1 text-2xl font-extrabold">
                          {money(item.amount)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/5 p-3">
                        <p className="text-xs text-slate-400">
                          Withdrawal method
                        </p>

                        <p className="mt-1 font-bold uppercase">
                          {item.method}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-white/10 p-4">
                      <p className="mb-3 text-sm font-bold text-violet-300">
                        Payment details
                      </p>

                      <p className="text-sm text-slate-300">
                        Account holder:{" "}
                        {item.accountDetails?.accountHolderName || "—"}
                      </p>

                      {item.method === "upi" ? (
                        <p className="mt-2 break-all text-sm text-slate-300">
                          UPI ID: {item.accountDetails?.upiId || "—"}
                        </p>
                      ) : (
                        <>
                          <p className="mt-2 text-sm text-slate-300">
                            Bank: {item.accountDetails?.bankName || "—"}
                          </p>

                          <p className="mt-2 break-all text-sm text-slate-300">
                            Account:{" "}
                            {item.accountDetails?.accountNumber || "—"}
                          </p>

                          <p className="mt-2 text-sm text-slate-300">
                            IFSC: {item.accountDetails?.ifscCode || "—"}
                          </p>
                        </>
                      )}
                    </div>

                    {item.adminNote && (
                      <p className="mt-3 text-xs text-slate-400">
                        Admin note: {item.adminNote}
                      </p>
                    )}

                    {/* Pending request actions */}
                    {item.status === "pending" && (
                      <div className="mt-4 space-y-3">
                        <input
                          value={withdrawalNotes[item._id] || ""}
                          onChange={(event) =>
                            setWithdrawalNotes((old) => ({
                              ...old,
                              [item._id]: event.target.value,
                            }))
                          }
                          maxLength={1000}
                          placeholder="Admin note / rejection reason"
                          className={inputClass}
                        />

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busyWithdrawal === item._id}
                            onClick={() =>
                              reviewWithdrawalRequest(item, "approved")
                            }
                            className={`${buttonClass} bg-emerald-600 hover:bg-emerald-500`}
                          >
                            {busyWithdrawal === item._id
                              ? "Saving..."
                              : "Approve"}
                          </button>

                          <button
                            type="button"
                            disabled={busyWithdrawal === item._id}
                            onClick={() =>
                              reviewWithdrawalRequest(item, "rejected")
                            }
                            className={`${buttonClass} bg-red-600 hover:bg-red-500`}
                          >
                            {busyWithdrawal === item._id
                              ? "Saving..."
                              : "Reject"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Approved request: payout still needs to happen */}
                    {item.status === "approved" && (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm text-blue-300">
                          Approved — actual payout is still pending.
                        </p>

                        <input
                          value={payoutReferences[item._id] || ""}
                          onChange={(event) =>
                            setPayoutReferences((old) => ({
                              ...old,
                              [item._id]: event.target.value,
                            }))
                          }
                          maxLength={100}
                          placeholder="Successful payout UTR / reference"
                          className={inputClass}
                        />

                        <button
                          type="button"
                          disabled={busyWithdrawal === item._id}
                          onClick={() => markWithdrawalAsPaid(item)}
                          className={`${buttonClass} bg-emerald-600 hover:bg-emerald-500`}
                        >
                          {busyWithdrawal === item._id
                            ? "Saving..."
                            : "Mark as Paid"}
                        </button>
                      </div>
                    )}

                    {/* Paid request */}
                    {item.status === "paid" && (
                      <p className="mt-4 break-all text-sm text-emerald-300">
                        Payout reference:{" "}
                        {item.payoutReference || "Not available"}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <p className="mt-6 text-xs leading-6 text-slate-500">
          Admin permissions backend par validate honi chahiye. Manual
          payment approval se pehle actual bank/UPI credit verify karein.
          Client ke bheje hue amount aur order reference ko backend par
          trusted order details se validate karna bhi zaroori hai.
        </p>
      </main>
    </div>
  );
}