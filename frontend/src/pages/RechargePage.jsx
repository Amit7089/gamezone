
import { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const EMPTY_SETTINGS = {
  upiId: "",
  payeeName: "",
  qrImageUrl: "",
  instructions: "",
};

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

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN");
}

function getStatusClass(status) {
  if (status === "approved") {
    return "bg-green-100 text-green-800";
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-800";
  }

  return "bg-amber-100 text-amber-800";
}

export default function RechargePage({
  onBack,
  onNavigate,
}) {
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [transactions, setTransactions] = useState([]);

  const [orderReference, setOrderReference] = useState("");
  const [purpose, setPurpose] = useState("product");
  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [settingsResponse, transactionsResponse] =
        await Promise.all([
          fetch(`${API_URL}/payments/settings`, {
            credentials: "include",
          }),

          fetch(`${API_URL}/payments/my-transactions`, {
            credentials: "include",
            headers: getAuthHeaders(),
          }),
        ]);

      const settingsData = await parseResponse(
        settingsResponse
      );

      const transactionsData = await parseResponse(
        transactionsResponse
      );

      if (settingsData.enabled && settingsData.settings) {
        setSettings({
          ...EMPTY_SETTINGS,
          ...settingsData.settings,
        });
      } else {
        setSettings(EMPTY_SETTINGS);
      }

      setTransactions(
        Array.isArray(transactionsData.transactions)
          ? transactionsData.transactions
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Payment details load nahi ho paaye. Login aur API URL check karein."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    // Initial page load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleBack() {
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate("Home");
    }
  }

  async function copyUpiId() {
    try {
      await navigator.clipboard.writeText(settings.upiId);

      setMessage("UPI ID copy ho gayi.");
      setError("");
    } catch {
      setError(
        "UPI ID copy nahi ho paayi. Ise manually copy karein."
      );
    }
  }

  async function submitPaymentReference(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    const cleanOrderReference = orderReference.trim();
    const cleanUtr = utr.trim();
    const numericAmount = Number(amount);

    if (!cleanOrderReference) {
      setError("Order/reference ID enter karein.");
      return;
    }

    if (
      !Number.isSafeInteger(numericAmount) ||
      numericAmount < 1
    ) {
      setError("Valid whole-number amount enter karein.");
      return;
    }

    if (!/^[A-Za-z0-9]{6,30}$/.test(cleanUtr)) {
      setError(
        "UTR/reference 6 se 30 letters ya numbers ka hona chahiye."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/payments/transactions`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            orderReference: cleanOrderReference,
            purpose,
            amount: numericAmount,
            utr: cleanUtr,
          }),
        }
      );

      const data = await parseResponse(response);

      setMessage(
        data.message ||
          "Payment reference submit ho gaya. Verification pending hai."
      );

      setOrderReference("");
      setAmount("");
      setUtr("");

      await loadData();
    } catch (err) {
      setError(
        err.message ||
          "Payment reference submit nahi ho paaya."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#eeeaff] pb-24 text-[#30245b]">
      {/* Header */}
      <header className="flex items-center justify-between bg-[#8045df] px-4 py-3 text-white">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="text-3xl leading-none"
        >
          ‹
        </button>

        <h1 className="text-lg font-bold">
          Product / Service Payment
        </h1>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Refresh
        </button>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 p-4">
        {/* Payment notice */}
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <h2 className="font-bold">
            Payment verification
          </h2>

          <p className="mt-1 leading-6">
            Reference submit karna payment successful hone
            ka proof nahi hai. Payment approve karne se pehle
            bank ya payment provider ke records se verify karein.
          </p>
        </section>

        {loading ? (
          <section className="rounded-xl bg-white p-5 text-sm text-gray-600">
            Payment details load ho rahi hain...
          </section>
        ) : (
          <>
            {/* Payment Settings */}
            {!settings.upiId && !settings.qrImageUrl ? (
              <section className="rounded-xl border border-[#d3c4f5] bg-white p-5">
                <h2 className="font-bold">
                  Payment method unavailable
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Admin ne payment instructions enable nahi
                  ki hain. Admin panel mein payment settings
                  save karke dobara refresh karein.
                </p>
              </section>
            ) : (
              <section className="space-y-4 rounded-xl border border-[#d3c4f5] bg-white p-5">
                <h2 className="text-lg font-bold">
                  Payment Details
                </h2>

                {settings.payeeName && (
                  <div className="rounded-xl bg-[#f5f0ff] p-3">
                    <p className="text-sm text-gray-500">
                      Payee / Business Name
                    </p>

                    <p className="mt-1 font-bold">
                      {settings.payeeName}
                    </p>
                  </div>
                )}

                {settings.upiId && (
                  <div className="rounded-xl bg-[#f5f0ff] p-3">
                    <p className="text-sm text-gray-500">
                      UPI ID
                    </p>

                    <p className="mt-1 break-all font-bold">
                      {settings.upiId}
                    </p>

                    <button
                      type="button"
                      onClick={copyUpiId}
                      className="mt-3 rounded-lg bg-[#8045df] px-4 py-2 text-sm font-bold text-white hover:bg-[#6d36c6]"
                    >
                      Copy UPI ID
                    </button>
                  </div>
                )}

                {settings.qrImageUrl && (
                  <div className="rounded-xl border border-gray-200 p-3">
                    <p className="mb-3 text-sm font-medium text-gray-600">
                      Payment QR
                    </p>

                    <img
                      src={settings.qrImageUrl}
                      alt="Configured payment QR"
                      referrerPolicy="no-referrer"
                      className="mx-auto max-h-64 w-full max-w-64 rounded-xl object-contain"
                      onError={(event) => {
                        event.currentTarget.alt =
                          "QR image load nahi ho paayi.";
                      }}
                    />
                  </div>
                )}

                {settings.instructions && (
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="font-semibold">
                      Payment Instructions
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {settings.instructions}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Submit Reference */}
            <form
              onSubmit={submitPaymentReference}
              className="space-y-4 rounded-xl border border-[#d3c4f5] bg-white p-5"
            >
              <h2 className="text-lg font-bold">
                Submit Payment Reference
              </h2>

              <div>
                <label
                  htmlFor="payment-purpose"
                  className="mb-1 block text-sm font-semibold"
                >
                  Payment Purpose
                </label>

                <select
                  id="payment-purpose"
                  value={purpose}
                  onChange={(event) =>
                    setPurpose(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3"
                >
                  <option value="product">
                    Product Order
                  </option>

                  <option value="service">
                    Service
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="order-reference"
                  className="mb-1 block text-sm font-semibold"
                >
                  Order / Reference ID
                </label>

                <input
                  id="order-reference"
                  value={orderReference}
                  onChange={(event) =>
                    setOrderReference(event.target.value)
                  }
                  maxLength={120}
                  required
                  placeholder="Enter your order ID"
                  className="w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label
                  htmlFor="payment-amount"
                  className="mb-1 block text-sm font-semibold"
                >
                  Amount Paid (₹)
                </label>

                <input
                  id="payment-amount"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  required
                  placeholder="Enter amount paid"
                  className="w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label
                  htmlFor="payment-utr"
                  className="mb-1 block text-sm font-semibold"
                >
                  UTR / Payment Reference
                </label>

                <input
                  id="payment-utr"
                  value={utr}
                  onChange={(event) =>
                    setUtr(event.target.value)
                  }
                  minLength={6}
                  maxLength={30}
                  pattern="[A-Za-z0-9]{6,30}"
                  required
                  autoComplete="off"
                  placeholder="Reference from payment app"
                  className="w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-violet-500"
                />
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  (!settings.upiId && !settings.qrImageUrl)
                }
                className="w-full rounded-xl bg-violet-600 px-4 py-3 font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit for Verification"}
              </button>
            </form>
          </>
        )}

        {/* Feedback */}
        {message && (
          <p
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </p>
        )}

        {/* Transaction History */}
        <section className="rounded-xl border border-[#d3c4f5] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">
              My Payment History
            </h2>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="text-sm font-bold text-violet-700 disabled:opacity-50"
            >
              Refresh Status
            </button>
          </div>

          {transactions.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              Abhi koi payment reference submit nahi hua.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {transactions.map((transaction) => (
                <article
                  key={transaction._id || transaction.id}
                  className="rounded-xl border border-gray-200 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">
                        {transaction.orderReference || "Order"}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        ₹
                        {Number(
                          transaction.amount || 0
                        ).toLocaleString("en-IN")}
                        {" · "}
                        {transaction.purpose || "Payment"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClass(
                        transaction.status
                      )}`}
                    >
                      {transaction.status || "pending"}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Submitted: {formatDate(transaction.createdAt)}
                  </p>

                  {transaction.adminNote && (
                    <p className="mt-2 text-sm text-gray-700">
                      Admin Note: {transaction.adminNote}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav
        active="Home"
        onNavigate={onNavigate || (() => {})}
      />
    </div>
  );
}
