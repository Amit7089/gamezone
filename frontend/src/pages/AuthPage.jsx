
import { useState } from "react";
import Navbar from "../components/Navbar";
import Login from "../components/Login";
import Register from "../components/Register";

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);

  function handleLoginSuccess(user) {
    // App.jsx ko successful login ki information bhejein.
    if (typeof onLoginSuccess === "function") {
      onLoginSuccess(user);
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(ellipse_at_15%_40%,rgba(109,40,217,0.20),transparent_45%)]" />

      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto grid min-h-[calc(100vh-130px)] w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 py-10 sm:px-8 md:grid-cols-2 lg:gap-20">
          <section className="hidden md:block">
            <p className="text-xs font-bold tracking-[3px] text-violet-400">
              YOUR NEXT LEVEL STARTS HERE
            </p>

            <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight lg:text-6xl">
              Welcome to
              <br />
              <span className="text-violet-400">GameZone.</span>
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">
              Your gaming space awaits. Sign in or create an account
              to get started.
            </p>

            <div className="mt-10 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-2xl text-violet-300">
                ✦
              </div>

              <div>
                <h3 className="text-sm font-semibold">
                  Your own dashboard
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Your profile and activities in one place.
                </p>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl shadow-black/30 sm:p-8">
            <div className="mb-7 grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  isLogin
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  !isLogin
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Register
              </button>
            </div>

            {isLogin ? (
              <Login
                onSwitch={() => setIsLogin(false)}
                onLoginSuccess={handleLoginSuccess}
              />
            ) : (
              <Register onSwitch={() => setIsLogin(true)} />
            )}

            <p className="mt-6 border-t border-white/10 pt-4 text-center text-[10px] leading-5 text-slate-500">
              GameZone · Account authentication enabled.
            </p>
          </section>
        </main>

        <footer className="border-t border-white/10 px-5 py-5 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} GameZone
        </footer>
      </div>
    </div>
  );
}
