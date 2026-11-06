
import { useState } from "react";
import { apiRequest } from "../utils/api";

export default function Login({ onSwitch, onLoginSuccess }) {
  const [loginMethod, setLoginMethod] = useState("mobile");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setMessageType("info");

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");

    const value = String(
      form.get("loginValue") || ""
    ).trim();

    if (!value || !password) {
      setMessageType("error");
      setMessage("Please enter your details and password.");
      return;
    }

    let payload = { password };

    if (loginMethod === "mobile") {
      const mobileNumber = value.replace(/\D/g, "");

      if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
        setMessageType("error");
        setMessage("Valid 10 digit mobile number enter karein.");
        return;
      }

      payload.mobileNumber = mobileNumber;
    } else {
      const email = value.toLowerCase();

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        email.length > 254
      ) {
        setMessageType("error");
        setMessage("Valid email address enter karein.");
        return;
      }

      payload.email = email;
    }

    setLoading(true);

    try {
      const result = await apiRequest("/auth/login", payload);

      if (!result?.success || !result?.token || !result?.user) {
        throw new Error(
          result?.message || "Server se valid login response nahi mila."
        );
      }

      const loggedInUser = result.user;

      if (!loggedInUser.id || !loggedInUser.role) {
        throw new Error(
          "Login response mein user role missing hai. Backend check karein."
        );
      }

      sessionStorage.setItem("authToken", result.token);
      sessionStorage.setItem(
        "user",
        JSON.stringify(loggedInUser)
      );

      setMessageType("success");
      setMessage(
        loggedInUser.role === "admin"
          ? "Admin login successful! Opening dashboard..."
          : "Login successful! Opening your account..."
      );

      if (typeof onLoginSuccess === "function") {
        onLoginSuccess(loggedInUser);
      }
    } catch (error) {
      console.error("Login error:", error);

      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");

      setMessageType("error");
      setMessage(
        error.message || "Login fail ho gaya. Dobara try karein."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-xs font-bold tracking-[2px] text-violet-400">
          WELCOME BACK
        </p>

        <h2 className="mt-3 text-2xl font-bold">
          Login to your account
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Choose your preferred login method.
        </p>
      </div>

      {/* Login Method Tabs */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1">
        <button
          type="button"
          onClick={() => {
            setLoginMethod("mobile");
            setMessage("");
          }}
          disabled={loading}
          className={`rounded-lg px-3 py-3 text-sm font-bold transition ${
            loginMethod === "mobile"
              ? "bg-violet-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Mobile Number
        </button>

        <button
          type="button"
          onClick={() => {
            setLoginMethod("email");
            setMessage("");
          }}
          disabled={loading}
          className={`rounded-lg px-3 py-3 text-sm font-bold transition ${
            loginMethod === "email"
              ? "bg-violet-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Email Address
        </button>
      </div>

      {/* Conditional Login Field */}
      <div>
        <label
          htmlFor="login-value"
          className="mb-2 block text-sm text-slate-200"
        >
          {loginMethod === "mobile"
            ? "Mobile Number"
            : "Email Address"}
        </label>

        {loginMethod === "mobile" ? (
          <div className="flex overflow-hidden rounded-xl border border-white/10 bg-slate-950 focus-within:border-violet-500">
            <span className="flex items-center border-r border-white/10 px-4 text-sm text-slate-400">
              +91
            </span>

            <input
              key="mobile"
              id="login-value"
              name="loginValue"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              placeholder="Enter 10 digit number"
              required
              disabled={loading}
              className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-slate-600"
            />
          </div>
        ) : (
          <input
            key="email"
            id="login-value"
            name="loginValue"
            type="email"
            autoComplete="email"
            maxLength={254}
            placeholder="Enter your email address"
            required
            disabled={loading}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500"
          />
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="login-password"
          className="mb-2 block text-sm text-slate-200"
        >
          Password
        </label>

        <div className="flex rounded-xl border border-white/10 bg-slate-950 focus-within:border-violet-500">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            disabled={loading}
            className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-slate-600"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword((previous) => !previous)
            }
            disabled={loading}
            className="px-3 text-xs font-bold text-violet-400"
          >
            {showPassword ? "HIDE" : "SHOW"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-between rounded-xl bg-violet-600 px-5 py-4 text-sm font-bold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Logging in..." : "Login Now"}

        <span className="text-lg">
          {loading ? "…" : "→"}
        </span>
      </button>

      {message && (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-lg p-3 text-xs leading-5 ${
            messageType === "error"
              ? "bg-red-500/10 text-red-300"
              : "bg-green-500/10 text-green-300"
          }`}
        >
          {message}
        </p>
      )}

      <p className="text-center text-sm text-slate-400">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          disabled={loading}
          className="font-bold text-violet-400 hover:text-violet-300"
        >
          Register
        </button>
      </p>
    </form>
  );
}
