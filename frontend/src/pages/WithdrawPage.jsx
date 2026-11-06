
import { useState } from "react";
import BottomNav from "../components/BottomNav";

const MIN_WITHDRAWAL = 350;
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function WithdrawPage({ onBack, onNavigate }) {
  const [realName, setRealName] = useState("");
  const [bankName, setBankName] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const withdrawalAmount = Number(amount);

    if (
      !Number.isSafeInteger(withdrawalAmount) ||
      withdrawalAmount < MIN_WITHDRAWAL
    ) {
      setMessageType("error");
      setMessage("Minimum withdrawal amount ₹350 hai.");
      return;
    }

    if (realName.trim().length < 2) {
      setMessageType("error");
      setMessage("Valid account holder name enter karein.");
      return;
    }

    if (bankName.trim().length < 2) {
      setMessageType("error");
      setMessage("Valid bank name enter karein.");
      return;
    }

    const cleanIFSC = ifsc.trim().toUpperCase();

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIFSC)) {
      setMessageType("error");
      setMessage("Valid IFSC code enter karein.");
      return;
    }

    if (!/^[0-9]{8,18}$/.test(accountNumber)) {
      setMessageType("error");
      setMessage("Valid bank account number enter karein.");
      return;
    }

    const token = sessionStorage.getItem("authToken");

    if (!token) {
      setMessageType("error");
      setMessage("Please login again. Authentication token nahi mila.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/withdrawals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: withdrawalAmount,
          method: "bank",
          accountDetails: {
            accountHolderName: realName.trim(),
            bankName: bankName.trim(),
            accountNumber,
            ifscCode: cleanIFSC,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Withdrawal request submit nahi ho saki."
        );
      }

      setMessageType("success");
      setMessage(
        data.message || "Withdrawal request successfully submit ho gayi hai."
      );

      setAmount("");
      setRealName("");
      setBankName("");
      setIfsc("");
      setAccountNumber("");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.message || "Server error. Please try again."
      );
    } finally {
      setLoading(false);
    }
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

        <h1 className="text-lg font-bold">Withdraw</h1>
      </header>

      <main className="mx-auto max-w-2xl px-3 py-5 sm:px-6">
        <section className="rounded-2xl bg-white p-4 sm:p-6">
          {/* BANNER */}
          <div className="flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-[#080d5c] via-blue-800 to-indigo-500 sm:h-56">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border-4 border-blue-300 bg-white p-5 text-5xl shadow-xl">
                💳
              </div>

              <div className="-ml-5 mt-12 rounded-2xl border-4 border-blue-300 bg-white p-4 text-4xl shadow-xl">
                🏦
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* MINIMUM WITHDRAWAL */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-extrabold text-amber-900">
                Minimum Withdrawal: ₹350
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-800">
                Aap ₹350 ya usse zyada amount withdraw kar sakte hain.
                ₹350 se kam withdrawal allowed nahi hai.
              </p>
            </div>

            {/* AMOUNT */}
            <div>
              <label
                htmlFor="withdrawAmount"
                className="mb-2 block text-base font-bold text-[#080d5c]"
              >
                Withdrawal Amount (₹)
              </label>

              <input
                id="withdrawAmount"
                type="number"
                inputMode="numeric"
                min={MIN_WITHDRAWAL}
                step="1"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setMessage("");
                }}
                placeholder="Minimum ₹350 enter karein"
                required
                className="w-full rounded-lg border-2 border-[#080d5c] bg-white px-4 py-4 text-base outline-none focus:ring-2 focus:ring-indigo-200"
              />

              {amount !== "" &&
                (!Number.isSafeInteger(Number(amount)) ||
                  Number(amount) < MIN_WITHDRAWAL) && (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    Minimum withdrawal ₹350 hai. Whole amount enter karein.
                  </p>
                )}
            </div>

            {/* ACCOUNT HOLDER */}
            <div>
              <label
                htmlFor="realName"
                className="mb-2 block text-base font-bold text-[#080d5c]"
              >
                Account Holder Name
              </label>

              <input
                id="realName"
                type="text"
                autoComplete="off"
                value={realName}
                onChange={(event) => setRealName(event.target.value)}
                placeholder="Please enter account holder name"
                required
                className="w-full rounded-lg border-2 border-[#080d5c] bg-white px-4 py-4 text-base outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* BANK NAME */}
            <div>
              <label
                htmlFor="bankName"
                className="mb-2 block text-base font-bold text-[#080d5c]"
              >
                Bank Name
              </label>

              <input
                id="bankName"
                type="text"
                value={bankName}
                onChange={(event) => setBankName(event.target.value)}
                placeholder="Enter bank name"
                required
                className="w-full rounded-lg border-2 border-[#080d5c] bg-white px-4 py-4 text-base outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* IFSC */}
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
                  setIfsc(event.target.value.toUpperCase().trim())
                }
                placeholder="Please enter IFSC code"
                maxLength={11}
                required
                className="w-full rounded-lg border-2 border-[#080d5c] bg-white px-4 py-4 text-base uppercase outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* ACCOUNT NUMBER */}
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
                  setAccountNumber(event.target.value.replace(/\D/g, ""))
                }
                placeholder="Please enter bank account number"
                maxLength={18}
                required
                className="w-full rounded-lg border-2 border-[#080d5c] bg-white px-4 py-4 text-base outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* NOTICE */}
            <p className="rounded-lg bg-slate-100 p-3 text-xs leading-5 text-slate-600">
              Aapki withdrawal request submit hone ke baad admin
              usse review karega. Request approve hone se pehle
              payment complete nahi maana jayega.
            </p>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={
                loading ||
                amount === "" ||
                !Number.isSafeInteger(Number(amount)) ||
                Number(amount) < MIN_WITHDRAWAL
              }
              className="w-full rounded-full bg-[#080d5c] py-4 text-lg font-bold text-white transition hover:bg-indigo-900 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "Submitting..." : "Confirm Withdrawal"}
            </button>

            {/* MESSAGE */}
            {message && (
              <p
                role="status"
                className={`rounded-lg p-3 text-sm leading-6 ${
                  messageType === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-emerald-50 text-emerald-800"
                }`}
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
