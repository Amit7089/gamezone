
import { useCallback, useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

function getAuthHeaders() {
  const token = sessionStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function MyPurchases({ onNavigate }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/wallet/my-purchases`, {
        method: "GET",
        credentials: "include",
        headers: getAuthHeaders(),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Purchases load nahi ho sake.");
      }

      setPurchases(
        Array.isArray(data.purchases) ? data.purchases : []
      );
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-[#080d5c] px-5 py-6 text-white">
        <p className="text-xs font-bold tracking-widest text-indigo-200">
          GAMEZONE
        </p>
        <h1 className="mt-2 text-2xl font-extrabold">My Products</h1>
        <p className="mt-1 text-sm text-indigo-200">
          Your purchased product history
        </p>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Purchased Products
          </h2>

          <button
            onClick={loadPurchases}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#080d5c] disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500">
            Loading your products...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button
              onClick={loadPurchases}
              className="ml-2 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && purchases.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <div className="text-5xl">🛍️</div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              No purchases yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Products you purchase will appear here.
            </p>
            <button
              onClick={() => onNavigate?.("Home")}
              className="mt-5 rounded-xl bg-[#080d5c] px-5 py-3 font-semibold text-white"
            >
              Explore Products
            </button>
          </div>
        )}

        {!loading && !error && purchases.length > 0 && (
          <div className="space-y-4">
            {purchases.map((item) => (
              <article
                key={item._id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex gap-4">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="h-24 w-24 rounded-xl bg-slate-100 object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900">
                      {item.productName}
                    </h3>

                    <p className="mt-2 text-lg font-extrabold text-[#080d5c]">
                      ₹{Number(item.price || 0).toLocaleString("en-IN")}
                    </p>

                    <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold capitalize text-green-700">
                      {item.status || "purchased"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  Purchase date:{" "}
                  {item.purchasedAt
                    ? new Date(item.purchasedAt).toLocaleString("en-IN")
                    : "—"}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <BottomNav active="My Products" onNavigate={onNavigate} />
    </div>
  );
}
