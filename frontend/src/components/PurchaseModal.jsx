
export default function PurchaseModal({
  product,
  walletBalance = 0,
  loading = false,
  onCancel,
  onConfirm,
  onRecharge,
}) {
  if (!product) return null;

  const price = Number(product.price || 0);
  const balance = Number(walletBalance || 0);
  const sufficientBalance = balance >= price;
  const remainingBalance = Math.max(0, balance - price);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-3xl">
            🛒
          </div>

          <h2 className="mt-3 text-xl font-extrabold text-slate-900">
            Confirm Purchase
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Please review your purchase details.
          </p>
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">Product</span>
            <span className="text-right font-bold text-slate-900">
              {product.name}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Product price</span>
            <span className="font-bold text-slate-900">
              ₹{price.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Wallet balance</span>
            <span className="font-bold text-slate-900">
              ₹{balance.toLocaleString("en-IN")}
            </span>
          </div>

          {sufficientBalance && (
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-sm text-slate-500">
                Balance after purchase
              </span>
              <span className="font-bold text-green-700">
                ₹{remainingBalance.toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>

        {!sufficientBalance && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Wallet balance insufficient hai. Recharge required:{" "}
            <strong>
              ₹{(price - balance).toLocaleString("en-IN")}
            </strong>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>

          {sufficientBalance ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="rounded-xl bg-[#080d5c] px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Processing..." : "Confirm Buy"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onRecharge}
              disabled={loading}
              className="rounded-xl bg-[#080d5c] px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              Recharge Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
