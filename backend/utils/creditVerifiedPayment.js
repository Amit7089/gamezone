
import WalletTransaction from "../models/WalletTransaction.js";

export async function creditVerifiedPayment(payment, session) {
  if (!payment?._id || !payment?.user || !(payment.amount > 0)) {
    throw new Error("Invalid payment transaction.");
  }

  if (payment.status !== "approved") {
    throw new Error("Payment must be verified and approved first.");
  }

  const sourceId = String(payment._id);

  // Prevent duplicate wallet credits.
  const existing = await WalletTransaction.findOne({
    sourceType: "paymentTransaction",
    sourceId,
    type: "deposit",
  }).session(session || null);

  if (existing) {
    if (existing.status === "posted") {
      return { credited: false, reason: "already-credited" };
    }

    throw new Error(
      "Existing wallet entry is not posted. Manual review is required."
    );
  }

  await WalletTransaction.create(
    [
      {
        user: payment.user,
        type: "deposit",
        amount: payment.amount,
        status: "posted",
        sourceType: "paymentTransaction",
        sourceId,
        description: `Verified payment ${payment.orderReference}`,
      },
    ],
    session ? { session } : {}
  );

  return { credited: true };
}
