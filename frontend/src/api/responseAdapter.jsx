export const extractPayload = (response) =>
  response?.data?.data ?? response?.data ?? null;

export const extractArray = (response) => {
  const payload = extractPayload(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const extractObject = (response) => {
  const payload = extractPayload(response);
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload;
  }
  return {};
};

export const extractErrorMessage = (error, fallback = "Request failed") => {
  // Handle different error response structures from backend
  if (error?.response?.data) {
    const data = error.response.data;
    // Backend sends errors in 'message' field
    if (data.message) return data.message;
    // Fallback to 'error' field if present
    if (data.error) return data.error;
  }
  // Network or other errors
  if (error?.message) return error.message;
  return fallback;
};
