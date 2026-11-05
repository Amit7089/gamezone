
import { useState } from "react";
import { apiRequest } from "../utils/api";

export default function Login({ onSwitch, onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setMessageType("info");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") || "");

    try {
      const result = await apiRequest("/auth/login", {
        email,
        password,
      });

      // Check API response
      if (!result?.success || !result?.token || !result?.user) {
        throw new Error(
          result?.message || "Server se valid login response nahi mila."
        );
      }

      const loggedInUser = result.user;

      // Role backend se aana zaroori hai.
      if (!loggedInUser.id || !loggedInUser.email || !loggedInUser.role) {
        console.error("Incomplete login user data:", loggedInUser);

        throw new Error(
          "Login response mein user role missing hai. Backend check karein."
        );
      }

      // Save complete authenticated session
      sessionStorage.setItem("authToken", result.token);
      sessionStorage.setItem(
        "user",
        JSON.stringify(loggedInUser)
      );

      // Debug information
      console.log("LOGIN API RESPONSE:", result);
      console.log("LOGIN USER:", loggedInUser);
      console.log("LOGIN USER ROLE:", loggedInUser.role);

      setMessageType("success");
      setMessage(
        loggedInUser.role === "admin"
          ? "Admin login successful! Opening dashboard..."
          : "Login successful! Opening your account..."
      );

      // Notify App.jsx
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
          Enter your details to continue.
        </p>
      </div>

      <div>
        <label
          htmlFor="login-email"
          className="mb-2 block text-sm text-slate-200"
        >
          Email address
        </label>

        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          placeholder="Enter your email"
          required
          disabled={loading}
          className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-violet-500 disabled:opacity-60"
        />
      </div>

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
            className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-slate-600 disabled:opacity-60"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword((previous) => !previous)
            }
            disabled={loading}
            className="px-3 text-xs font-bold text-violet-400 disabled:opacity-60"
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
              : messageType === "success"
                ? "bg-green-500/10 text-green-300"
                : "bg-violet-500/10 text-violet-200"
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
          className="font-bold text-violet-400 hover:text-violet-300 disabled:opacity-60"
        >
          Register
        </button>
      </p>
    </form>
  );
}
