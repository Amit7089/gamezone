
export default function PurchaseModal({ product, onCancel, onConfirm }) {
  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5 py-6"
      onClick={onCancel}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-title"
        className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="purchase-title"
          className="border-b border-slate-200 px-5 py-5 text-center text-xl font-medium text-slate-800"
        >
          {product.name}
        </h2>

        <div className="space-y-3 px-6 py-8 text-base leading-7 text-green-700 sm:px-10">
          <p>Are you sure you want to purchase this product?</p>

          <ul className="space-y-1 pt-2">
            <li>● Price : ₹{product.price}</li>
            <li>
              ● Total profit (demo) : ₹
              {product.totalProfit.toLocaleString("en-IN")}
            </li>
          </ul>

          <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            Demo confirmation only. No money will be charged and no real
            profit is generated.
          </p>
        </div>

        <div className="grid grid-cols-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="border-r border-slate-200 px-4 py-5 text-lg text-slate-800 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-5 text-lg font-medium text-sky-600 hover:bg-sky-50"
          >
            Confirm
          </button>
        </div>
      </section>
    </div>
  );
}
