
import { useCallback, useEffect, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

function getAuthHeaders() {
  const token = sessionStorage.getItem("authToken");

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || `Request failed (${response.status})`
    );
  }

  return data;
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN");
}

export default function AdminPaymentTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [filter, setFilter] = useState("all");

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/payments/admin/transactions`,
        {
          credentials: "include",
          headers: getAuthHeaders(),
        }
      );

      const data = await parseResponse(response);
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err.message || "Transactions load nahi hui.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  async function reviewTransaction(transaction, status) {
    const action = status === "approved" ? "approve" : "reject";

    const adminNote = window.prompt(
      status === "approved"
        ? "Actual payment verify karne ke baad note enter karein:"
        : "Reject karne ka reason enter karein:"
    );

    if (adminNote === null) return;

    if (status === "rejected" && !adminNote.trim()) {
      setError("Reject karne ka reason enter karein.");
      return;
    }

    const confirmed = window.confirm(
      `Kya aap is transaction ko ${action} karna chahte hain? Actual bank/UPI payment verify karna zaroori hai.`
    );

    if (!confirmed) return;

    setBusyId(transaction._id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/payments/admin/transactions/${transaction._id}/review`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            status,
            adminNote: adminNote.trim(),
          }),
        }
      );

      const data = await parseResponse(response);

      setMessage(
        data.message || `Transaction ${status} mark ho gaya.`
      );

      await loadTransactions();
    } catch (err) {
      setError(err.message || "Transaction review nahi hua.");
    } finally {
      setBusyId("");
    }
  }

  const filteredTransactions =
    filter === "all"
      ? transactions
      : transactions.filter((item) => item.status === filter);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Payment Transactions</h2>
          <p className="mt-1 text-sm text-gray-500">
            Product/service payment references review karein.
          </p>
        </div>

        <button
          type="button"
          onClick={loadTransactions}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div>
        <label
          htmlFor="transaction-filter"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Filter transactions
        </label>

        <select
          id="transaction-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2"
        >
          <option value="all">All transactions</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {message && (
        <p
          role="status"
          className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
        >
          {message}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {loading ? (
        <p className="p-4">Transactions load ho rahi hain...</p>
      ) : filteredTransactions.length === 0 ? (
        <p className="rounded-xl bg-gray-50 p-4 text-gray-600">
          Is filter mein koi transaction nahi hai.
        </p>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((item) => (
            <article
              key={item._id}
              className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-bold">
                    Order: {item.orderReference}
                  </p>

                  <p className="text-sm text-gray-500">
                    {item.user?.name ||
                      item.user?.email ||
                      "Customer"}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(item.createdAt)}
                  </p>
                </div>

                <span
                  className={`h-fit rounded-full px-3 py-1 text-sm capitalize ${
                    item.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : item.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Amount</p>
                  <p className="font-bold">{money(item.amount)}</p>
                </div>

                <div>
                  <p className="text-gray-500">Purpose</p>
                  <p className="capitalize">{item.purpose}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-gray-500">UTR / Reference</p>
                  <p className="break-all font-semibold">
                    {item.utr}
                  </p>
                </div>
              </div>

              {item.adminNote && (
                <p className="break-words text-sm text-gray-600">
                  Admin note: {item.adminNote}
                </p>
              )}

              {item.status === "pending" && (
                <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    disabled={busyId === item._id}
                    onClick={() =>
                      reviewTransaction(item, "approved")
                    }
                    className="flex-1 rounded-lg bg-green-600 px-3 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {busyId === item._id
                      ? "Processing..."
                      : "Approve"}
                  </button>

                  <button
                    type="button"
                    disabled={busyId === item._id}
                    onClick={() =>
                      reviewTransaction(item, "rejected")
                    }
                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <p className="text-xs leading-5 text-gray-500">
        UTR/reference number alone payment proof nahi hai. Approval se
        pehle actual bank/UPI record verify karein.
      </p>
    </section>
  );
}
