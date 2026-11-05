
import { useEffect, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const emptySettings = {
  upiId: "",
  payeeName: "",
  qrImageUrl: "",
  instructions: "",
  isEnabled: false,
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

export default function AdminPaymentSettings() {
  const [form, setForm] = useState(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/payments/admin/settings`,
          {
            credentials: "include",
            headers: getAuthHeaders(),
          }
        );

        const data = await parseResponse(response);

        if (!cancelled) {
          setForm({
            ...emptySettings,
            ...(data.settings || {}),
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Settings load nahi hui.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(event) {
    const { name, value, checked, type } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setMessage("");
    setError("");
  }

  async function saveSettings(event) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/payments/admin/settings`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            upiId: form.upiId.trim(),
            payeeName: form.payeeName.trim(),
            qrImageUrl: form.qrImageUrl.trim(),
            instructions: form.instructions.trim(),
            isEnabled: form.isEnabled,
          }),
        }
      );

      const data = await parseResponse(response);

      setForm({
        ...emptySettings,
        ...(data.settings || form),
      });

      setMessage(
        data.message || "Payment settings successfully save ho gayi."
      );
    } catch (err) {
      setError(err.message || "Settings save nahi hui.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="p-4 text-sm text-slate-500">
        Settings load ho rahi hain...
      </p>
    );
  }

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">
        Payment Settings
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Genuine product/service checkout ke liye payment configuration.
      </p>

      <form onSubmit={saveSettings} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="payment-upi-id"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            UPI ID
          </label>

          <input
            id="payment-upi-id"
            name="upiId"
            value={form.upiId}
            onChange={updateField}
            maxLength={100}
            placeholder="yourname@bank"
            autoComplete="off"
            className="w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-violet-500"
          />
        </div>

        <div>
          <label
            htmlFor="payment-payee-name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Payee / Business Name
          </label>

          <input
            id="payment-payee-name"
            name="payeeName"
            value={form.payeeName}
            onChange={updateField}
            maxLength={100}
            placeholder="Business name"
            className="w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-violet-500"
          />
        </div>

        <div>
          <label
            htmlFor="payment-qr-url"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            QR Image URL (optional)
          </label>

          <input
            id="payment-qr-url"
            name="qrImageUrl"
            type="url"
            value={form.qrImageUrl}
            onChange={updateField}
            maxLength={2048}
            placeholder="https://example.com/qr.png"
            className="w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-violet-500"
          />
        </div>

        {form.qrImageUrl && (
          <div className="rounded-xl border border-gray-200 p-3">
            <p className="mb-2 text-sm font-medium text-gray-600">
              QR Preview
            </p>

            <img
              src={form.qrImageUrl}
              alt="Payment QR preview"
              referrerPolicy="no-referrer"
              className="h-44 w-44 rounded-xl border border-gray-200 bg-white object-contain p-2"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        <div>
          <label
            htmlFor="payment-instructions"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Payment Instructions
          </label>

          <textarea
            id="payment-instructions"
            name="instructions"
            value={form.instructions}
            onChange={updateField}
            rows={4}
            maxLength={500}
            placeholder="Customer ke liye payment instructions"
            className="w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-violet-500"
          />
        </div>

        <label className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
          <input
            type="checkbox"
            name="isEnabled"
            checked={form.isEnabled}
            onChange={updateField}
            className="h-4 w-4 accent-violet-600"
          />

          <span className="text-sm font-medium text-gray-800">
            Enable payment instructions
          </span>
        </label>

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

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-violet-600 px-4 py-3 font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Payment Settings"}
        </button>
      </form>
    </section>
  );
}
