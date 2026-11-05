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
    return "bg-green-100 text-green-700";
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-700";
}

export default function RechargePage({
  onBack,
  onNavigate,
  initialAmount = null,
  initialTab = "Recharge",
  initialOrderReference = "",
}) {
  const fixedAmount =
    initialAmount !== null &&
    initialAmount !== undefined &&
    Number.isSafeInteger(Number(initialAmount)) &&
    Number(initialAmount) > 0
      ? Number(initialAmount)
      : null;

  const isAmountLocked = fixedAmount !== null;

  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [transactions, setTransactions] = useState([]);

  // Order ID parent component se automatically receive hogi.
  const [orderReference, setOrderReference] = useState(
    initialOrderReference || ""
  );

  const [purpose, setPurpose] = useState("product");

  const [amount, setAmount] = useState(
    fixedAmount !== null ? String(fixedAmount) : ""
  );

  const [utr, setUtr] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Parent se amount update hone par amount input sync karo.
  useEffect(() => {
    if (fixedAmount !== null) {
      setAmount(String(fixedAmount));
      setPurpose("product");
    } else {
      setAmount("");
    }
  }, [fixedAmount]);

  // Parent se nayi Order ID aaye to input update karo.
  useEffect(() => {
    setOrderReference(initialOrderReference || "");
  }, [initialOrderReference]);

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

      const settingsData = await parseResponse(settingsResponse);

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
    // Page open hone par data ek baar load karo.
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
      setError(
        "Order ID generate nahi hui. Please Recharge page dobara open karein."
      );
      return;
    }

    if (
      !Number.isSafeInteger(numericAmount) ||
      numericAmount < 1
    ) {
      setError("Valid whole-number amount enter karein.");
      return;
    }

    if (isAmountLocked && numericAmount !== fixedAmount) {
      setError(
        "Product ka payment amount change nahi kiya ja sakta."
      );
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
            purpose: isAmountLocked ? "product" : purpose,
            amount: isAmountLocked ? fixedAmount : numericAmount,
            utr: cleanUtr,
          }),
        }
      );

      const data = await parseResponse(response);

      setMessage(
        data.message ||
          "Payment reference submit ho gaya. Verification pending hai."
      );

      setUtr("");

      // Successful submission ke baad order ID aur amount
      // screen par hi rahenge, jab tak user page se na nikle.
      await loadData();
    } catch (err) {
      setError(
        err.message || "Payment reference submit nahi ho paaya."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 pb-24 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-[#10145c] to-blue-700 text-white shadow-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-2xl transition hover:bg-white/20"
          >
            ‹
          </button>

          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-base font-extrabold sm:text-lg">
              Payment Details
            </h1>

            <p className="text-[10px] text-blue-100 sm:text-xs">
              Secure payment reference submission
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="rounded-xl bg-white/15 px-3 py-2 text-xs font-bold transition hover:bg-white/25 disabled:opacity-50"
          >
            ↻ Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-3 py-5 sm:px-5">
        {/* Selected Product Amount */}
        {isAmountLocked && (
          <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#10145c] to-blue-700 p-5 text-white shadow-lg sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-blue-100">
                  Selected Product Payment
                </p>

                <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
                  ₹{fixedAmount.toLocaleString("en-IN")}
                </h2>

                <p className="mt-2 text-xs text-blue-100">
                  Product price automatically applied
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl">
                📱
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold">
              <span>🔒</span>
              <span>Amount fixed hai — edit nahi kar sakte.</span>
            </div>
          </section>
        )}

        {/* Automatic Order ID */}
        <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Your Order ID
              </h2>

              <p className="mt-1 text-[11px] text-slate-500">
                Automatically generated reference
              </p>
            </div>

            <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-bold text-green-700">
              Auto Generated
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={orderReference}
              readOnly
              placeholder="Generating Order ID..."
              className="min-w-0 flex-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-xs font-extrabold text-[#10145c] outline-none sm:text-sm"
            />

            <button
              type="button"
              disabled={!orderReference}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(orderReference);
                  setMessage("Order ID copy ho gayi.");
                  setError("");
                } catch {
                  setError("Order ID copy nahi ho paayi.");
                }
              }}
              className="rounded-xl bg-[#10145c] px-3 py-3 text-xs font-bold text-white transition hover:bg-blue-800 disabled:opacity-50"
            >
              Copy
            </button>
          </div>

          <p className="mt-2 text-[10px] text-slate-500">
            Is Order ID ko payment record ke saath use kiya jayega.
          </p>
        </section>

        {/* Verification Warning */}
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <span className="text-xl">⚠️</span>

            <div>
              <h2 className="text-sm font-extrabold text-amber-900">
                Payment verification
              </h2>

              <p className="mt-1 text-xs leading-5 text-amber-800 sm:text-sm">
                Payment reference submit karna payment successful hone
                ka proof nahi hai. Approval se pehle bank ya payment
                provider ke records se payment verify ki jayegi.
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            Payment details load ho rahi hain...
          </section>
        ) : (
          <>
            {/* Payment Settings */}
            {!settings.upiId && !settings.qrImageUrl ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-3xl">💳</div>

                <h2 className="mt-2 font-extrabold">
                  Payment method unavailable
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Admin ne payment instructions enable nahi ki hain.
                  Admin panel mein payment settings save karke dobara
                  refresh karein.
                </p>
              </section>
            ) : (
              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div>
                  <h2 className="text-lg font-extrabold">
                    Pay Using UPI
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Admin ke configured payment details use karein.
                  </p>
                </div>

                {settings.payeeName && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Payee / Business Name
                    </p>

                    <p className="mt-1 font-bold">
                      {settings.payeeName}
                    </p>
                  </div>
                )}

                {settings.upiId && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-semibold text-slate-500">
                      UPI ID
                    </p>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="min-w-0 flex-1 break-all text-sm font-extrabold text-[#10145c] sm:text-base">
                        {settings.upiId}
                      </p>

                      <button
                        type="button"
                        onClick={copyUpiId}
                        className="rounded-lg bg-[#10145c] px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-800"
                      >
                        Copy UPI
                      </button>
                    </div>
                  </div>
                )}

                {settings.qrImageUrl && (
                  <div className="rounded-xl border border-slate-200 p-4 text-center">
                    <p className="mb-3 text-sm font-bold">
                      Scan QR to Pay
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
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm font-bold">
                      Payment Instructions
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-600 sm:text-sm">
                      {settings.instructions}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Payment Reference Form */}
            <form
              onSubmit={submitPaymentReference}
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div>
                <h2 className="text-lg font-extrabold">
                  Submit Payment Reference
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Payment karne ke baad UTR details submit karein.
                </p>
              </div>

              {!isAmountLocked && (
                <div>
                  <label
                    htmlFor="payment-purpose"
                    className="mb-2 block text-sm font-bold"
                  >
                    Payment Purpose
                  </label>

                  <select
                    id="payment-purpose"
                    value={purpose}
                    onChange={(event) =>
                      setPurpose(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="product">Product Order</option>
                    <option value="service">Service</option>
                  </select>
                </div>
              )}

              {/* Order ID is automatically generated above. */}

              {/* Amount */}
              <div>
                <label
                  htmlFor="payment-amount"
                  className="mb-2 block text-sm font-bold"
                >
                  Amount to Pay (₹)
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-extrabold text-slate-500">
                    ₹
                  </span>

                  <input
                    id="payment-amount"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={amount}
                    onChange={(event) => {
                      if (!isAmountLocked) {
                        setAmount(event.target.value);
                      }
                    }}
                    readOnly={isAmountLocked}
                    required
                    placeholder="Enter amount"
                    className={`w-full rounded-xl border py-3 pl-10 pr-4 text-lg font-extrabold outline-none transition ${
                      isAmountLocked
                        ? "cursor-not-allowed border-blue-200 bg-blue-50 text-[#10145c]"
                        : "border-slate-200 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                </div>

                {isAmountLocked && (
                  <p className="mt-2 text-[11px] font-semibold text-blue-700">
                    🔒 Product price automatically set ki gayi hai.
                  </p>
                )}
              </div>

              {/* UTR */}
              <div>
                <label
                  htmlFor="payment-utr"
                  className="mb-2 block text-sm font-bold"
                >
                  UTR / Payment Reference
                </label>

                <input
                  id="payment-utr"
                  value={utr}
                  onChange={(event) => setUtr(event.target.value)}
                  minLength={6}
                  maxLength={30}
                  pattern="[A-Za-z0-9]{6,30}"
                  required
                  autoComplete="off"
                  placeholder="Enter UTR from your payment app"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1 text-[10px] text-slate-400">
                  6–30 letters or numbers.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  !orderReference ||
                  (!settings.upiId && !settings.qrImageUrl)
                }
                className="w-full rounded-xl bg-gradient-to-r from-[#10145c] to-blue-700 px-4 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:from-blue-700 hover:to-[#10145c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit for Verification →"}
              </button>

              <p className="text-center text-[10px] leading-5 text-slate-400">
                Please submit the correct UTR. Duplicate or incorrect
                references may be rejected.
              </p>
            </form>
          </>
        )}

        {/* Feedback */}
        {message && (
          <p
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            ✓ {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {/* Transaction History */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold sm:text-lg">
                My Payment History
              </h2>

              <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">
                Track your submitted payment references.
              </p>
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="text-xs font-bold text-blue-700 disabled:opacity-50"
            >
              Refresh Status
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-5 text-center">
              <div className="text-3xl">🧾</div>

              <p className="mt-2 text-sm font-semibold text-slate-600">
                No payment records yet
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Your submitted references will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {transactions.map((transaction) => (
                <article
                  key={transaction._id || transaction.id}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-all text-sm font-extrabold">
                        {transaction.orderReference || "Order"}
                      </p>

                      <p className="mt-1 text-sm font-bold text-[#10145c]">
                        ₹
                        {Number(transaction.amount || 0).toLocaleString(
                          "en-IN"
                        )}
                      </p>

                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {transaction.purpose || "Payment"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold capitalize ${getStatusClass(
                        transaction.status
                      )}`}
                    >
                      {transaction.status || "pending"}
                    </span>
                  </div>

                  <p className="mt-3 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                    Submitted: {formatDate(transaction.createdAt)}
                  </p>

                  {transaction.adminNote && (
                    <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
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