
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function getPaymentSettings() {
  const response = await fetch(`${API_BASE_URL}/payments/settings`);

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Payment settings load nahi hui.");
  }

  return data;
}

export async function submitPaymentReference(payload, token) {
  const response = await fetch(`${API_BASE_URL}/payments/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Payment reference submit nahi hua.");
  }

  return data;
}

export async function getMyPayments(token) {
  const response = await fetch(`${API_BASE_URL}/payments/my-transactions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Payment history load nahi hui.");
  }

  return data;
}
