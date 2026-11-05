
import { useState } from "react";
import BottomNav from "../components/BottomNav";

export default function WithdrawPage({ onBack, onNavigate }) {
  const [realName, setRealName] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    setMessage(
      "Demo only: form preview complete. Bank details save ya submit nahi ki gayi hain."
    );
  }

  return (
    <div className="min-h-screen bg-[#ededed] pb-24 text-slate-900">
      <header className="relative flex h-[76px] items-center justify-center bg-[#080d5c] px-4 text-white">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="absolute left-5 text-3xl"
        >
          ‹
        </button>

        <h1 className="text-lg font-bold">Bind Wallet Address</h1>
      </header>

      <main className="mx-auto max-w-2xl px-3 py-5 sm:px-6">
        <section className="rounded-2xl bg-white p-4 sm:p-6">
          <div className="flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-[#080d5c] via-blue-800 to-indigo-500 sm:h-56">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border-4 border-blue-300 bg-white p-5 text-5xl shadow-xl">
                💬
              </div>
              <div className="-ml-5 mt-12 rounded-2xl border-4 border-blue-300 bg-white p-4 text-4xl shadow-xl">
                🎙️
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-7">
            <div>
              <label
                htmlFor="realName"
                className="mb-2 block text-base font-bold text-[#080d5c]"
              >
                Real Name
              </label>
              <input
                id="realName"
                type="text"
                autoComplete="off"
                value={realName}
                onChange={(event) => setRealName(event.target.value)}
                placeholder="Please enter real name"
                required
                className="w-full rounded-lg border-2 border-[#080d5c] bg-white px-4 py-4 text-base outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label
                htmlFor="ifsc"
                className="mb-2 block text-base font-bold text-[#080d5c]"
              >
                IFSC Code
              </label>
              <input
                id="ifsc"
                type="text"
                autoComplete="off"
                value={ifsc}
                onChange={(event) =>
                  setIfsc(event.target.value.toUpperCase())
                }
                placeholder="Please enter IFSC code"
                maxLength={11}
                required
                className="w-full rounded-lg border-2 border-[#080d5c] bg-white px-4 py-4 text-base uppercase outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label
                htmlFor="accountNumber"
                className="mb-2 block text-base font-bold text-[#080d5c]"
              >
                Account Number
              </label>
              <input
                id="accountNumber"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={accountNumber}
                onChange={(event) =>
                  setAccountNumber(
                    event.target.value.replace(/\D/g, "")
                  )
                }
                placeholder="Please enter bank account number"
                maxLength={18}
                required
                className="w-full rounded-lg border-2 border-[#080d5c] bg-white px-4 py-4 text-base outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              Demo form only. Real bank details enter na karein.
              Is form se koi bank account link ya withdrawal nahi hoga.
            </p>

            <button
              type="submit"
              className="w-full rounded-full bg-[#080d5c] py-4 text-lg font-bold text-white transition hover:bg-indigo-900 active:scale-[0.99]"
            >
              Confirm
            </button>

            {message && (
              <p
                role="status"
                className="rounded-lg bg-emerald-50 p-3 text-sm leading-6 text-emerald-800"
              >
                {message}
              </p>
            )}
          </form>
        </section>
      </main>

      <BottomNav active="My" onNavigate={onNavigate} />
    </div>
  );
}
