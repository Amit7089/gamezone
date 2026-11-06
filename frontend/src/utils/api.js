
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

function getAuthToken() {
  const token = sessionStorage.getItem("authToken");

  if (!token) {
    throw new Error("Please log in first.");
  }

  return token;
}

async function handleResponse(response, defaultMessage) {
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || defaultMessage);
  }

  return result;
}

// POST API
export async function apiRequest(endpoint, data) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response, "Request failed");
}

// Authenticated GET API
export async function authenticatedGet(endpoint) {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(response, "Request failed");
}

// Authenticated POST API
export async function authenticatedPost(endpoint, data = {}) {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response, "Request failed");
}

// GET MY PROFILE
export async function getMyProfile() {
  return authenticatedGet("/profile/me");
}

// GET RECHARGE RECORDS
export async function getRechargeRecords() {
  return authenticatedGet("/recharge");
}

// GET MY REFERRAL TEAM
export async function getMyTeam() {
  return authenticatedGet("/referrals/team");
}

// GET MY REFERRAL DETAILS
export async function getMyReferralDetails() {
  return authenticatedGet("/referrals/me");
}
