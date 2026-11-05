
import { useState } from "react";
import { apiRequest } from "../utils/api";

export default function Register({ onSwitch }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  async function handleSubmit(e) {
    e.preventDefault();

    // Important: await se pehle form reference save karein.
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);

    setMessage("");

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(
      formData.get("confirmPassword") || ""
    );

    const termsAccepted = formData.get("terms") === "on";

    if (name.length < 2 || name.length > 60) {
      setMessageType("error");
      setMessage("Name 2 se 60 characters ke beech hona chahiye.");
      return;
    }

    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("Dono passwords same hone chahiye.");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setMessageType("error");
      setMessage("Password 8 se 72 characters ka hona chahiye.");
      return;
    }

    if (!termsAccepted) {
      setMessageType("error");
      setMessage("Please website terms accept karein.");
      return;
    }

    setLoading(true);

    try {
      const result = await apiRequest("/auth/register", {
        name,
        email,
        password
      });

      setMessageType("success");
      setMessage(
        result.message || "Account successfully create ho gaya!"
      );

      // Saved reference use karein; e.currentTarget nahi.
      formElement.reset();
      setShowPassword(false);

      // Registration ke baad login screen par jaane ka option.
      // Success message bhi show hota rahega agar switch nahi hota.
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.message || "Registration fail ho gaya. Dobara try karein."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-xs font-bold tracking-[2px] text-violet-400">
          JOIN GAMEZONE
        </p>
        <h2 className="mt-3 text-2xl font-bold">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Register to get started.
        </p>
      </div>

      <div>
        <label
          htmlFor="register-name"
          className="mb-2 block text-sm text-slate-200"
        >
          Full name
        </label>
        <input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          minLength={2}
          maxLength={60}
          placeholder="Enter your full name"
          required
          disabled={loading}
          className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500 disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="register-email"
          className="mb-2 block text-sm text-slate-200"
        >
          Email address
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          placeholder="Enter your email"
          required
          disabled={loading}
          className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500 disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="register-password"
          className="mb-2 block text-sm text-slate-200"
        >
          Password
        </label>
        <input
          id="register-password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          placeholder="At least 8 characters"
          required
          disabled={loading}
          className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500 disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="mb-2 block text-sm text-slate-200"
        >
          Confirm password
        </label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          placeholder="Enter password again"
          required
          disabled={loading}
          className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500 disabled:opacity-60"
        />
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={() => setShowPassword((previous) => !previous)}
        className="text-xs font-semibold text-violet-400 disabled:opacity-60"
      >
        {showPassword ? "Hide password" : "Show password"}
      </button>

      <label className="flex items-start gap-2 text-xs leading-5 text-slate-400">
        <input
          type="checkbox"
          name="terms"
          required
          disabled={loading}
          className="mt-1 accent-violet-500"
        />
        I agree to the website terms.
      </label>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-between rounded-xl bg-violet-600 px-5 py-4 text-sm font-bold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create Account"}
        <span className="text-lg">{loading ? "…" : "→"}</span>
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
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          disabled={loading}
          className="font-bold text-violet-400 hover:text-violet-300 disabled:opacity-60"
        >
          Login
        </button>
      </p>
    </form>
  );
}
