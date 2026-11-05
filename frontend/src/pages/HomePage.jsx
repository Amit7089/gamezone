import { useCallback, useEffect, useState } from "react";

import HomeBanner from "../components/HomeBanner";
import QuickActions from "../components/QuickActions";
import BottomNav from "../components/BottomNav";
import PurchaseModal from "../components/PurchaseModal";

import RechargePage from "./RechargePage";
import FeaturePage from "./FeaturePage";
import TeamPage from "./TeamPage";
import MyPage from "./MyPage";
import AccountSubPage from "./AccountSubPage";
import MyPurchases from "./MyPurchases";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const products = [
  {
    id: 1,
    name: "iPhone 15 Pro",
    description: "Premium smartphone · Demo Plan A",
    image: "/images/iphone.png",
    price: 550,
    dailyProfit: 120,
    duration: 180,
    totalProfit: 21600,
    comingSoon: false,
    tag: "Popular",
    color: "from-slate-100 to-slate-200",
  },
  {
    id: 2,
    name: "Samsung Galaxy S24",
    description: "Android smartphone · Demo Plan B",
    image: "/images/samsung.png",
    price: 600,
    dailyProfit: 130,
    duration: 180,
    totalProfit: 23400,
    comingSoon: false,
    tag: "Featured",
    color: "from-blue-50 to-indigo-100",
  },
  {
    id: 3,
    name: "Redmi Note 13 Pro",
    description: "Everyday smartphone · Demo Plan C",
    image: "/images/redmi.png",
    price: 450,
    dailyProfit: 100,
    duration: 180,
    totalProfit: 18000,
    comingSoon: false,
    tag: "Value Pick",
    color: "from-orange-50 to-amber-100",
  },
  {
    id: "coming-soon-1",
    name: "OnePlus 12",
    description: "Flagship performance · Upcoming Plan D",
    image: "/images/oneplus.png",
    price: 700,
    dailyProfit: 150,
    duration: 180,
    totalProfit: 27000,
    comingSoon: true,
    tag: "Coming Soon",
    color: "from-red-50 to-rose-100",
  },
  {
    id: "coming-soon-2",
    name: "Google Pixel 9",
    description: "AI camera smartphone · Upcoming Plan E",
    image: "/images/pixel.png",
    price: 750,
    dailyProfit: 160,
    duration: 180,
    totalProfit: 28800,
    comingSoon: true,
    tag: "Coming Soon",
    color: "from-emerald-50 to-teal-100",
  },
  {
    id: "coming-soon-3",
    name: "Vivo X100",
    description: "Premium camera phone · Upcoming Plan F",
    image: "/images/vivo.png",
    price: 650,
    dailyProfit: 140,
    duration: 180,
    totalProfit: 25200,
    comingSoon: true,
    tag: "Coming Soon",
    color: "from-violet-50 to-purple-100",
  },
];

const accountPages = [
  "Income",
  "Personal information",
  "Income details",
  "Recharge records",
  "Withdrawal records",
  "About us",
  "Language",
];

// Unique-looking reference for identifying a submitted payment.
function generateOrderReference() {
  const random = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `GZ-${Date.now()}-${random}`;
}

function getAuthHeaders() {
  const token = sessionStorage.getItem("authToken");

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    const error = new Error(
      data.message || `Request failed (${response.status})`
    );

    error.data = data;
    error.status = response.status;

    throw error;
  }

  return data;
}

function getBalanceFromResponse(data) {
  const possibleBalances = [
    data?.availableBalance,
    data?.wallet?.availableBalance,
    data?.wallet?.balance,
    data?.balance,
    data?.data?.availableBalance,
    data?.data?.wallet?.availableBalance,
    data?.data?.balance,
  ];

  const balance = possibleBalances.find(
    (value) => value !== undefined && value !== null
  );

  return Number(balance || 0);
}

// Responsive Product Card
function HomeProductCard({ product, onBuy }) {
  const [imageError, setImageError] = useState(false);

  const isComingSoon = product.comingSoon;

  return (
    <article
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 ${
        isComingSoon
          ? "border-violet-100"
          : "border-slate-200 hover:-translate-y-1 hover:shadow-xl"
      }`}
    >
      <div
        className={`relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br sm:h-44 ${product.color}`}
      >
        <span
          className={`absolute left-2 top-2 z-10 rounded-full px-2 py-1 text-[9px] font-extrabold sm:left-3 sm:top-3 sm:px-3 sm:text-[11px] ${
            isComingSoon
              ? "bg-violet-600 text-white"
              : "bg-white text-slate-800 shadow-sm"
          }`}
        >
          {product.tag}
        </span>

        {isComingSoon && (
          <span className="absolute right-2 top-2 rounded-full border border-violet-200 bg-white/90 px-2 py-1 text-[9px] font-bold text-violet-700 sm:right-3 sm:top-3 sm:text-[10px]">
            NOT ACTIVE
          </span>
        )}

        {!imageError ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImageError(true)}
            className={`h-[85%] w-[85%] object-contain drop-shadow-lg transition-transform duration-300 sm:h-[88%] sm:w-[88%] ${
              isComingSoon
                ? "opacity-70 grayscale-[25%]"
                : "group-hover:scale-105"
            }`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <span className="text-4xl sm:text-6xl">📱</span>
            <span className="mt-1 text-[10px] font-semibold text-slate-500">
              {product.name}
            </span>
          </div>
        )}

        {isComingSoon && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/10">
            <span className="rounded-lg border border-white/70 bg-slate-900/75 px-3 py-1.5 text-[10px] font-extrabold tracking-wider text-white shadow-lg sm:text-xs">
              COMING SOON
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <div className="min-h-[48px] sm:min-h-[58px]">
          <h3 className="line-clamp-2 text-xs font-extrabold leading-5 text-slate-900 sm:text-base sm:leading-6">
            {product.name}
          </h3>

          <p className="mt-0.5 line-clamp-2 text-[9px] leading-4 text-slate-500 sm:text-xs">
            {product.description}
          </p>
        </div>

        <div className="mt-2 rounded-xl bg-slate-50 p-2 sm:mt-3 sm:p-3">
          <p className="text-[9px] font-medium text-slate-500 sm:text-xs">
            Demo Product Price
          </p>

          <p className="mt-0.5 text-base font-extrabold text-[#10145c] sm:text-xl">
            ₹{product.price.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="mt-2 space-y-1.5 sm:mt-3 sm:space-y-2">
          <div className="flex items-center justify-between gap-1 text-[9px] sm:text-xs">
            <span className="text-slate-500">Daily sample figure</span>
            <strong className="text-emerald-700">
              ₹{product.dailyProfit.toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-1 text-[9px] sm:text-xs">
            <span className="text-slate-500">Sample duration</span>
            <strong className="text-slate-800">
              {product.duration} Days
            </strong>
          </div>

          <div className="flex items-center justify-between gap-1 border-t border-dashed border-slate-200 pt-1.5 text-[9px] sm:pt-2 sm:text-xs">
            <span className="text-slate-500">Illustrative total</span>
            <strong className="text-[#10145c]">
              ₹{product.totalProfit.toLocaleString("en-IN")}
            </strong>
          </div>
        </div>

        <div className="mt-auto pt-3 sm:pt-4">
          {isComingSoon ? (
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-violet-200 bg-violet-50 px-2 py-2.5 text-[10px] font-extrabold text-violet-600 opacity-90 sm:py-3 sm:text-sm"
            >
              🔒 Coming Soon
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onBuy(product)}
              className="w-full rounded-xl bg-gradient-to-r from-[#10145c] to-blue-700 px-2 py-2.5 text-[10px] font-extrabold text-white shadow-md transition hover:from-blue-700 hover:to-[#10145c] active:scale-[0.98] sm:py-3 sm:text-sm"
            >
              Buy Now →
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function HomePage({ onLogout }) {
  const [page, setPage] = useState("Home");
  const [purchaseProduct, setPurchaseProduct] = useState(null);

  const [rechargeTab, setRechargeTab] = useState("Recharge");
  const [rechargeAmount, setRechargeAmount] = useState(null);
  const [rechargeOrderReference, setRechargeOrderReference] =
    useState("");

  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const [walletError, setWalletError] = useState("");
  const [notice, setNotice] = useState("");

  const loadWalletBalance = useCallback(async () => {
    setWalletLoading(true);
    setWalletError("");

    try {
      const response = await fetch(`${API_URL}/wallet/summary`, {
        method: "GET",
        credentials: "include",
        headers: getAuthHeaders(),
      });

      const data = await parseResponse(response);

      setWalletBalance(getBalanceFromResponse(data));
    } catch (error) {
      setWalletError(
        error.message || "Wallet balance load nahi hua."
      );
    } finally {
      setWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWalletBalance();
  }, [loadWalletBalance]);

  function handleNavigate(destination) {
    if (destination === "Log out") {
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");

      setPurchaseProduct(null);
      setRechargeAmount(null);
      setRechargeOrderReference("");

      if (typeof onLogout === "function") {
        onLogout();
      } else {
        window.location.reload();
      }

      return;
    }

    if (destination === "Recharge") {
      setRechargeTab("Recharge");
      setRechargeAmount(null);
      setRechargeOrderReference(generateOrderReference());
    }

    if (
      destination === "Withdraw" ||
      destination === "Withdrawal"
    ) {
      destination = "My";
    }

    setNotice("");
    setWalletError("");
    setPurchaseProduct(null);
    setPage(destination);
  }

  function handleBuy(product) {
    if (!product || product.comingSoon) return;

    setNotice("");
    setRechargeAmount(null);
    setRechargeOrderReference("");
    setPurchaseProduct(product);
  }

  // Normal wallet recharge: amount manually enter hoga,
  // lekin Order ID automatic generate hogi.
  function handleRecharge() {
    setPurchaseProduct(null);
    setRechargeAmount(null);
    setRechargeOrderReference(generateOrderReference());
    setRechargeTab("Recharge");
    setPage("Recharge");
  }

  // Product recharge: amount aur Order ID dono automatic.
  function handleProductRecharge() {
    if (!purchaseProduct || purchaseProduct.comingSoon) return;

    const amount = Number(purchaseProduct.price);

    if (!Number.isFinite(amount) || amount <= 0) return;

    setRechargeAmount(amount);
    setRechargeOrderReference(generateOrderReference());
    setPurchaseProduct(null);
    setRechargeTab("Recharge");
    setPage("Recharge");
  }

  async function handleConfirm() {
    if (
      !purchaseProduct ||
      purchaseProduct.comingSoon ||
      purchaseLoading
    ) {
      return;
    }

    const selectedProduct = purchaseProduct;

    const requestId =
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `purchase-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 12)}`;

    setPurchaseLoading(true);
    setNotice("");
    setWalletError("");

    try {
      const response = await fetch(`${API_URL}/wallet/purchase`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          productId: String(selectedProduct.id),
          requestId,
        }),
      });

      const data = await parseResponse(response);

      setPurchaseProduct(null);
      setRechargeAmount(null);
      setRechargeOrderReference("");

      if (
        data.wallet?.availableBalance !== undefined ||
        data.availableBalance !== undefined ||
        data.balance !== undefined
      ) {
        setWalletBalance(getBalanceFromResponse(data));
      } else {
        await loadWalletBalance();
      }

      setNotice(
        data.message ||
          "Purchase successful! Your product is now in My Products."
      );

      setPage("Home");
    } catch (error) {
      const responseData = error.data || {};

      const rechargeRequired =
        responseData.rechargeRequired === true ||
        responseData.code === "INSUFFICIENT_BALANCE";

      if (rechargeRequired) {
        if (responseData.availableBalance !== undefined) {
          setWalletBalance(Number(responseData.availableBalance));
        } else {
          await loadWalletBalance();
        }

        setRechargeAmount(Number(selectedProduct.price));
        setRechargeOrderReference(generateOrderReference());

        setPurchaseProduct(null);
        setRechargeTab("Recharge");
        setPage("Recharge");

        setWalletError(
          `Wallet balance insufficient hai. Product price: ₹${Number(
            selectedProduct.price
          ).toLocaleString("en-IN")}. Payment reference submit karne ke baad admin verification ka wait karein.`
        );
      } else {
        setWalletError(
          error.message || "Purchase complete nahi ho saka."
        );
      }
    } finally {
      setPurchaseLoading(false);
    }
  }

  if (page === "Recharge") {
    return (
      <RechargePage
        initialTab={rechargeTab}
        initialAmount={rechargeAmount}
        initialOrderReference={rechargeOrderReference}
        onNavigate={handleNavigate}
        onBack={() => {
          setPage("Home");
          setRechargeAmount(null);
          setRechargeOrderReference("");
          loadWalletBalance();
        }}
      />
    );
  }

  if (page === "My Products") {
    return <MyPurchases onNavigate={handleNavigate} />;
  }

  if (page === "Team") {
    return <TeamPage onNavigate={handleNavigate} />;
  }

  if (page === "My") {
    return <MyPage onNavigate={handleNavigate} />;
  }

  if (accountPages.includes(page)) {
    return (
      <AccountSubPage
        page={page}
        onBack={() => setPage("My")}
        onNavigate={handleNavigate}
      />
    );
  }

  if (page !== "Home") {
    return (
      <FeaturePage
        page={page}
        onNavigate={handleNavigate}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f6fb] text-slate-900">
      <main className="mx-auto w-full max-w-6xl space-y-5 px-3 pb-28 pt-4 sm:space-y-7 sm:px-6 sm:pt-6">
        <HomeBanner />

        {/* Wallet Card */}
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#10145c] via-[#19247d] to-blue-700 p-4 text-white shadow-lg sm:rounded-3xl sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-blue-100 sm:text-sm">
                Available Wallet Balance
              </p>

              <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">
                {walletLoading
                  ? "Loading..."
                  : `₹${walletBalance.toLocaleString("en-IN")}`}
              </h2>
            </div>

            <button
              type="button"
              onClick={loadWalletBalance}
              disabled={walletLoading}
              className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-50 sm:text-sm"
            >
              ↻ Refresh
            </button>
          </div>

          {walletError && (
            <p className="mt-3 rounded-lg bg-red-500/15 p-2 text-xs text-red-100">
              {walletError}
            </p>
          )}

          <button
            type="button"
            onClick={handleRecharge}
            className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-[#10145c] shadow-sm transition hover:bg-blue-50"
          >
            + Recharge Wallet
          </button>
        </section>

        {notice && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
            {notice}

            <button
              type="button"
              onClick={() => setPage("My Products")}
              className="ml-2 font-bold underline"
            >
              View My Products
            </button>
          </div>
        )}

        <QuickActions onNavigate={handleNavigate} />

        {/* Products */}
        <section id="products" className="space-y-4 sm:space-y-5">
          <div className="flex items-end justify-between gap-2 px-1">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                Featured Mobiles
              </h2>

              <p className="mt-1 text-[11px] text-slate-500 sm:text-sm">
                Explore our product collection
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-700 sm:text-xs">
              {products.length} Products
            </span>
          </div>

          <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {products.map((product) => (
              <HomeProductCard
                key={product.id}
                product={product}
                onBuy={handleBuy}
              />
            ))}
          </div>
        </section>

        {/* Demo Information */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-center text-[10px] leading-5 text-amber-900 sm:p-4 sm:text-xs">
          Demo information only. All prices and daily/total figures
          shown are illustrative sample values, not actual earnings
          or guaranteed returns. Coming Soon products are not
          available for purchase. Any real purchase should represent
          a genuine product or service.
        </div>
      </main>

      <BottomNav
        active="Home"
        onNavigate={handleNavigate}
      />

      <PurchaseModal
        product={purchaseProduct}
        walletBalance={walletBalance}
        loading={purchaseLoading || walletLoading}
        onCancel={() => setPurchaseProduct(null)}
        onConfirm={handleConfirm}
        onRecharge={handleProductRecharge}
      />
    </div>
  );
}