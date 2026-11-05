
import { useState } from "react";

import HomeBanner from "../components/HomeBanner";
import QuickActions from "../components/QuickActions";
import ProductCard from "../components/ProductCard";
import BottomNav from "../components/BottomNav";
import PurchaseModal from "../components/PurchaseModal";

import RechargePage from "./RechargePage";
import WithdrawPage from "./WithdrawPage";
import FeaturePage from "./FeaturePage";
import TeamPage from "./TeamPage";
import MyPage from "./MyPage";
import AccountSubPage from "./AccountSubPage";

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

export default function HomePage({ onLogout }) {
  const [page, setPage] = useState("Home");
  const [purchaseProduct, setPurchaseProduct] = useState(null);
  const [rechargeTab, setRechargeTab] = useState("Recharge");

  function handleNavigate(destination) {
    if (destination === "Log out") {
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");

      setPurchaseProduct(null);

      if (typeof onLogout === "function") {
        onLogout();
      } else {
        // Fallback: App.jsx should normally provide onLogout.
        window.location.reload();
      }

      return;
    }

    if (destination === "Recharge") {
      setRechargeTab("Recharge");
    }

    setPage(destination);
    setPurchaseProduct(null);
  }

  function handleBuy(product) {
    setPurchaseProduct(product);
  }

  function handleConfirm() {
    if (!purchaseProduct) return;

    setPurchaseProduct(null);
    setRechargeTab("Recharge");
    setPage("Recharge");
  }

  if (page === "Recharge") {
    return (
      <RechargePage
        initialTab={rechargeTab}
        onNavigate={handleNavigate}
        onBack={() => setPage("Home")}
      />
    );
  }

  if (page === "Withdraw") {
    return (
      <WithdrawPage
        onBack={() => setPage("Home")}
        onNavigate={handleNavigate}
      />
    );
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
    <div className="min-h-screen bg-[#f4f4f5] text-slate-900">
      <main className="mx-auto max-w-6xl space-y-5 px-3 pb-28 pt-4 sm:px-6 sm:pt-6">
        <HomeBanner />

        <QuickActions onNavigate={handleNavigate} />

        <section id="products" className="space-y-4">
          <div className="px-1">
            <h2 className="text-xl font-extrabold sm:text-2xl">
              Featured Mobiles
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sample plans for demo purposes only
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onBuy={handleBuy}
              />
            ))}
          </div>
        </section>

        <p className="rounded-xl bg-white p-3 text-center text-xs leading-5 text-slate-500">
          Demo website only. Prices and profit figures are sample values,
          not guaranteed returns or actual earnings.
        </p>
      </main>

      <BottomNav
        active="Home"
        onNavigate={handleNavigate}
      />

      <PurchaseModal
        product={purchaseProduct}
        onCancel={() => setPurchaseProduct(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
