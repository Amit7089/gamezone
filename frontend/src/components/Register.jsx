
import { useState } from "react";
import { apiRequest } from "../utils/api";

export default function Register({ onSwitch }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  // Automatically read referral code from URL (?ref=CODE)
  const [referralCode, setReferralCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get("ref") || "").trim().toUpperCase();
  });

  async function handleSubmit(e) {
    e.preventDefault();

    const formElement = e.currentTarget;
    const formData = new FormData(formElement);

    setMessage("");

    const name = String(formData.get("name") || "").trim();

    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();

    const mobileNumber = String(
      formData.get("mobileNumber") || ""
    ).replace(/\D/g, "");

    const password = String(formData.get("password") || "");

    const confirmPassword = String(
      formData.get("confirmPassword") || ""
    );

    const termsAccepted = formData.get("terms") === "on";

    const cleanReferralCode = referralCode.trim().toUpperCase();

    // Name validation
    if (name.length < 2 || name.length > 60) {
      setMessageType("error");
      setMessage("Name 2 se 60 characters ke beech hona chahiye.");
      return;
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessageType("error");
      setMessage("Valid email address enter karein.");
      return;
    }

    // Mobile validation
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setMessageType("error");
      setMessage("Valid 10 digit mobile number enter karein.");
      return;
    }

    // Password confirmation
    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("Dono passwords same hone chahiye.");
      return;
    }

    // Password length
    if (password.length < 8 || password.length > 72) {
      setMessageType("error");
      setMessage("Password 8 se 72 characters ka hona chahiye.");
      return;
    }

    // Terms validation
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
        mobileNumber,
        password,
        referralCode: cleanReferralCode,
      });

      setMessageType("success");
      setMessage(
        result.message || "Account successfully create ho gaya!"
      );

      formElement.reset();
      setShowPassword(false);

      // Clear referral input after successful registration
      setReferralCode("");

      // Registration ke baad Login Page par redirect
      onSwitch?.();
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.message || "Registration fail ho gaya. Dobara try karein."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-60";

  const labelClass =
    "mb-1.5 block text-xs font-semibold text-slate-300";

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-md space-y-3.5"
    >
      {/* REWARD BANNER */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-yellow-500/15 p-3.5 sm:p-4">
        <div className="absolute -right-5 -top-8 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-400/15 text-2xl">
            🎁
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[2px] text-amber-300">
              Welcome Reward
            </p>

            <h2 className="mt-0.5 text-xl font-black text-white sm:text-2xl">
              ₹50 Cashback
            </h2>

            <p className="mt-0.5 text-[11px] leading-4 text-amber-100/75">
              Register now and get ₹50 cashback!
            </p>
          </div>

          <div className="shrink-0 rounded-full border border-amber-300/30 bg-amber-400/10 px-2.5 py-1 text-[9px] font-bold text-amber-200">
            JOIN BONUS
          </div>
        </div>
      </div>

      {/* HEADER */}
      <div className="pb-1">
        <p className="text-[10px] font-bold tracking-[2.5px] text-violet-400">
          JOIN GAMEZONE
        </p>

        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white">
          Create Account
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Join GameZone and start your gaming journey.
        </p>
      </div>

      {/* NAME */}
      <div>
        <label htmlFor="register-name" className={labelClass}>
          Full Name
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
          className={inputClass}
        />
      </div>

      {/* EMAIL */}
      <div>
        <label htmlFor="register-email" className={labelClass}>
          Email Address
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
          className={inputClass}
        />
      </div>

      {/* MOBILE */}
      <div>
        <label htmlFor="register-mobile" className={labelClass}>
          Mobile Number
        </label>

        <div className="flex overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/10">
          <span className="flex shrink-0 items-center border-r border-white/10 px-3 text-sm font-semibold text-slate-400">
            🇮🇳 +91
          </span>

          <input
            id="register-mobile"
            name="mobileNumber"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            pattern="[6-9][0-9]{9}"
            maxLength={10}
            placeholder="10 digit mobile number"
            required
            disabled={loading}
            className="w-full min-w-0 bg-transparent px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* REFERRAL CODE */}
      <div>
        <label htmlFor="register-referral" className={labelClass}>
          Referral Code (Optional)
        </label>

        <input
          id="register-referral"
          name="referralCode"
          type="text"
          value={referralCode}
          onChange={(e) =>
            setReferralCode(e.target.value.toUpperCase())
          }
          placeholder="Enter referral code"
          maxLength={20}
          disabled={loading}
          className={inputClass}
        />

        {referralCode && (
          <p className="mt-1.5 text-[11px] text-green-400">
            ✓ Referral code applied
          </p>
        )}
      </div>

      {/* PASSWORD */}
      <div>
        <label htmlFor="register-password" className={labelClass}>
          Create Password
        </label>

        <div className="flex overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/10">
          <input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            placeholder="Minimum 8 characters"
            required
            disabled={loading}
            className="w-full min-w-0 bg-transparent px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-600"
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={loading}
            className="shrink-0 px-3 text-[10px] font-bold text-violet-400"
          >
            {showPassword ? "HIDE" : "SHOW"}
          </button>
        </div>
      </div>

      {/* CONFIRM PASSWORD */}
      <div>
        <label htmlFor="confirm-password" className={labelClass}>
          Confirm Password
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
          className={inputClass}
        />
      </div>

      {/* TERMS */}
      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] leading-5 text-slate-400">
        <input
          type="checkbox"
          name="terms"
          required
          disabled={loading}
          className="mt-1 shrink-0 accent-violet-500"
        />

        <span>
          I agree to the website terms and conditions.
        </span>
      </label>

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-violet-900/20 transition hover:from-violet-500 hover:to-purple-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>
          {loading ? "Creating Account..." : "Create My Account"}
        </span>

        <span className="text-lg">
          {loading ? "…" : "→"}
        </span>
      </button>

      {/* MESSAGE */}
      {message && (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-xl p-3 text-xs leading-5 ${
            messageType === "error"
              ? "bg-red-500/10 text-red-300"
              : "bg-green-500/10 text-green-300"
          }`}
        >
          {message}
        </p>
      )}

      {/* LOGIN LINK */}
      <div className="border-t border-white/5 pt-3 text-center">
        <p className="text-xs text-slate-400">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitch}
            disabled={loading}
            className="font-bold text-violet-400 transition hover:text-violet-300"
          >
            Login Now
          </button>
        </p>
      </div>
    </form>
  );
}
