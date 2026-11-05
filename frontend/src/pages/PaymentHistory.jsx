
import { useCallback, useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

function getHeaders() {
  const token = sessionStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN");
}

function statusStyle(status) {
  if (status === "approved") {
    return "bg-green-100 text-green-700";
  }
  if (status === "rejected") {
    return "bg-red-100 text-red-700";
  }
  return "bg-amber-100 text-amber-700";
}

export default function PaymentHistory({ onBack, onNavigate }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/payments/my-transactions`,
        {
          credentials: "include",
          headers: getHeaders(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || `Request failed (${response.status})`
        );
      }

      setTransactions(
        Array.isArray(data.transactions) ? data.transactions : []
      );
    } catch (err) {
      setError(err.message || "Payment history load nahi hui.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  function goBack() {
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate("Recharge");
    }
  }

  return (
    <div className="min-h-screen bg-[#eeeaff] pb-24 text-[#30245b]">
      <header className="flex items-center justify-between bg-[#8045df] px-4 py-4 text-white">
        <button
          type="button"
          onClick={goBack}
          className="text-3xl leading-none"
          aria-label="Go back"
        >
          ‹
        </button>

        <h1 className="text-lg font-bold">My Payment History</h1>

        <button
          type="button"
          onClick={loadTransactions}
          disabled={loading}
          className="rounded-lg bg-white/15 px-3 py-2 text-xs font-bold disabled:opacity-50"
        >
          Refresh
        </button>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <section className="rounded-xl border border-[#d3c4f5] bg-white p-4">
          <h2 className="text-lg font-bold">Transactions</h2>
          <p className="mt-1 text-sm text-gray-500">
            Apni payment requests aur unka latest review status dekhein.
          </p>
        </section>

        {loading && (
          <div className="rounded-xl bg-white p-5 text-sm text-gray-600">
            Payment history load ho rahi hai...
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button
              type="button"
              onClick={loadTransactions}
              className="ml-2 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && transactions.length === 0 && (
          <div className="rounded-xl border border-[#d3c4f5] bg-white p-6 text-center">
            <div className="text-4xl">🧾</div>
            <h3 className="mt-3 font-bold">No transactions yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Payment submit karne ke baad yahan record dikhega.
            </p>
            <button
              type="button"
              onClick={() => onNavigate?.("Recharge")}
              className="mt-4 rounded-xl bg-[#8045df] px-5 py-3 font-bold text-white"
            >
              Go to Payment
            </button>
          </div>
        )}

        {!loading && transactions.length > 0 && (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <article
                key={tx._id || tx.id}
                className="rounded-xl border border-[#d3c4f5] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-all font-bold">
                      {tx.orderReference || "Order"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      ₹{Number(tx.amount || 0).toLocaleString("en-IN")}
                      {" · "}
                      {tx.purpose || "Payment"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyle(tx.status)}`}
                  >
                    {tx.status || "pending"}
                  </span>
                </div>

                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500">
                    Submitted: {formatDate(tx.createdAt)}
                  </p>

                  {tx.adminNote && (
                    <p className="mt-2 text-sm text-gray-700">
                      <span className="font-semibold">Admin note: </span>
                      {tx.adminNote}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <BottomNav
        active="Home"
        onNavigate={onNavigate || (() => {})}
      />
    </div>
  );
}
