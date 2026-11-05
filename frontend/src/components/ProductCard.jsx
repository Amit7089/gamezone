
export default function ProductCard({ product, onBuy }) {
  const details = [
    { label: "Price", value: `₹${product.price}` },
    { label: "Daily profit (demo)", value: `₹${product.dailyProfit}` },
    { label: "Duration", value: `${product.duration} Days` },
    {
      label: "Total profit (demo)",
      value: `₹${product.totalProfit.toLocaleString("en-IN")}`,
    },
  ];

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-4">
      <div className="relative overflow-hidden rounded-xl bg-slate-50">
        <img
          src={product.image}
          alt={`${product.name} promotional image`}
          className="block aspect-[4/3] w-full object-cover object-center"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </div>

      <div className="px-1 pt-4">
        <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
          {product.name}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {product.description}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {details.map((detail) => (
            <div
              key={detail.label}
              className="flex min-h-[82px] flex-col items-center justify-center rounded-xl bg-slate-50 px-2 py-3 text-center"
            >
              <p className="text-lg font-extrabold leading-tight text-[#09145e] sm:text-xl">
                {detail.value}
              </p>

              <p className="mt-2 text-xs leading-4 text-slate-500">
                {detail.label}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onBuy(product)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#080d5c] px-4 py-3.5 font-semibold text-white transition hover:bg-indigo-900 active:scale-[0.99]"
        >
          <span aria-hidden="true">🛒</span>
          Buy now
        </button>
      </div>
    </article>
  );
}
