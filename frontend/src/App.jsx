
import { useState } from "react";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import AdminDashboard from "./pages/AdminDashboard";
import PaymentHistory from "./pages/PaymentHistory";
import RechargePage from "./pages/RechargePage";

function readUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(readUser);
  const [currentPage, setCurrentPage] = useState("Home");

  const loggedIn = Boolean(
    sessionStorage.getItem("authToken") && user
  );

  function handleLoginSuccess(loggedInUser) {
    const savedUser = loggedInUser || readUser();
    setUser(savedUser);
    setCurrentPage("Home");
  }

  function handleLogout() {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("user");
    setUser(null);
    setCurrentPage("Home");
  }

  function handleNavigate(destination) {
    setCurrentPage(destination);
  }

  if (!loggedIn) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (user?.role === "admin") {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (currentPage === "PaymentHistory") {
    return (
      <PaymentHistory
        onBack={() => setCurrentPage("Recharge")}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === "Recharge") {
    return (
      <RechargePage
        onBack={() => setCurrentPage("Home")}
        onNavigate={handleNavigate}
      />
    );
  }

  return (
    <HomePage
      onLogout={handleLogout}
      onNavigate={handleNavigate}
    />
  );
}
