
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export async function apiRequest(endpoint, data) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Request failed");
  }

  return result;
}

export async function getMyProfile() {
  const token = sessionStorage.getItem("authToken");

  if (!token) {
    throw new Error("Please log in first.");
  }

  const response = await fetch(`${API_URL}/profile/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Profile fetch failed");
  }

  return result;
}

export async function getRechargeRecords() {
  const token = sessionStorage.getItem("authToken");

  if (!token) {
    throw new Error("Please log in first.");
  }

  const response = await fetch(`${API_URL}/recharge`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Recharge records fetch failed");
  }

  return result;
}
