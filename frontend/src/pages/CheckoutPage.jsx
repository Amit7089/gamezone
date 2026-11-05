import { useEffect, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export default function CheckoutPage({
  orderReference,
  amount,
  purpose = "product",
  onBack,
}) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [method, setMethod] = useState("upi");
  const [utr, setUtr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSettings() {
      try {
        const response = await fetch(
          `${API_URL}/payments/settings`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Payment settings load nahi hui."
          );
        }

        if (!data.enabled || !data.settings) {
          throw new Error(
            "Payment method abhi available nahi hai."
          );
        }

        if (!controller.signal.aborted) {
          setSettings(data.settings);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Settings load nahi hui.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSettings();
    return () => controller.abort();
  }, []);

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(String(value));
      setMessage("Copied successfully.");
    } catch {
      setMessage("Copy nahi ho paaya. Text manually copy karein.");
    }
  }

  async function submitReference(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!orderReference || !Number.isFinite(amount) || amount <= 0) {
      setError("Valid order aur amount required hain.");
      return;
    }

    if (!/^[A-Za-z0-9]{6,30}$/.test(utr.trim())) {
      setError("Reference number 6–30 letters/numbers ka hona chahiye.");
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
          },
          body: JSON.stringify({
            orderReference,
            amount,
            purpose,
            utr: utr.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Reference submit nahi hua."
        );
      }

      setTransaction(data.transaction);
      setUtr("");
      setMessage(
        "Reference submit ho gaya. Payment verification pending hai."
      );
    } catch (err) {
      setError(err.message || "Request fail ho gayi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl p-6">
        Payment details load ho rahi hain...
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-6">
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border px-4 py-2"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#eeeaff] p-4 text-[#30245b]">
      <div className="mx-auto max-w-xl space-y-4">
        <header className="flex items-center justify-between rounded-xl bg-[#8045df] p-4 text-white">
          <button type="button" onClick={onBack}>
            ‹ Back
          </button>
          <h1 className="font-bold">Checkout</h1>
          <span />
        </header>

        <section className="rounded-xl bg-white p-4">
          <p className="text-sm text-gray-500">Order reference</p>
          <p className="font-bold">{orderReference}</p>
          <p className="mt-3 text-sm text-gray-500">Order amount</p>
          <p className="text-2xl font-extrabold text-[#8045df]">
            ₹{Number(amount).toLocaleString("en-IN")}
          </p>
        </section>

        <section className="rounded-xl bg-white p-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod("upi")}
              className={`rounded-xl border-2 p-3 font-bold ${
                method === "upi"
                  ? "border-[#8045df] bg-[#f0e9ff]"
                  : "border-gray-200"
              }`}
            >
              UPI Details
            </button>

            <button
              type="button"
              onClick={() => setMethod("qr")}
              className={`rounded-xl border-2 p-3 font-bold ${
                method === "qr"
                  ? "border-[#8045df] bg-[#f0e9ff]"
                  : "border-gray-200"
              }`}
            >
              Scan QR
            </button>
          </div>

          {method === "upi" ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-[#f7f4ff] p-3">
                <p className="text-sm text-gray-500">Payee name</p>
                <p className="font-bold">{settings.payeeName}</p>
              </div>

              <div className="rounded-xl bg-[#f7f4ff] p-3">
                <p className="text-sm text-gray-500">UPI ID</p>
                <p className="break-all font-bold">{settings.upiId}</p>
                <button
                  type="button"
                  onClick={() => copyText(settings.upiId)}
                  className="mt-2 rounded-lg bg-[#8045df] px-4 py-2 text-white"
                >
                  Copy UPI ID
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-center">
              {settings.qrImageUrl ? (
                <img
                  src={settings.qrImageUrl}
                  alt="Business payment QR"
                  className="mx-auto h-56 w-56 rounded-xl border bg-white object-contain p-2"
                />
              ) : (
                <p className="rounded-xl bg-amber-50 p-4 text-amber-800">
                  Admin ne QR image upload nahi ki hai.
                </p>
              )}
            </div>
          )}

          {settings.instructions && (
            <div className="mt-4 whitespace-pre-wrap rounded-xl bg-[#f7f4ff] p-3 text-sm leading-6">
              {settings.instructions}
            </div>
          )}
        </section>

        <form
          onSubmit={submitReference}
          className="space-y-3 rounded-xl bg-white p-4"
        >
          <h2 className="font-bold">Payment Reference</h2>
          <p className="text-sm text-gray-500">
            Payment karne ke baad apna transaction reference submit karein.
            Sirf reference submit karne se order paid nahi hota.
          </p>

          <input
            value={utr}
            onChange={(event) => setUtr(event.target.value)}
            maxLength={30}
            placeholder="Enter UTR / reference number"
            className="w-full rounded-xl border p-3 outline-none focus:border-[#8045df]"
            required
          />

          <button
            type="submit"
            disabled={submitting || Boolean(transaction)}
            className="w-full rounded-full bg-[#8045df] p-3 font-bold text-white disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Reference"}
          </button>

          {message && (
            <p role="status" className="text-sm text-green-700">
              {message}
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          {transaction && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="font-bold text-amber-800">
                Status: {transaction.status}
              </p>
              <p className="mt-1 text-sm text-amber-800">
                Payment abhi verify nahi hui hai.
              </p>
            </div>
          )}
        </form>

        <p className="text-center text-xs leading-5 text-gray-500">
          Order ko paid mark karne se pehle bank/UPI transaction verify karein.
        </p>
      </div>
    </main>
  );
}