// Simple API helper for frontend-backend communication (fixed to backend port)
const API_BASE_URL = 'http://localhost:3000';

function getAuthToken() {
  try {
    return localStorage.getItem('authToken') || '';
  } catch (_) {
    return '';
  }
}

async function apiRequest(path, { method = 'GET', body, headers = {}, auth = false } = {}) {
  const url = `${API_BASE_URL}${path}`;
  const requestHeaders = { ...headers };
  // Only set JSON content-type if body is not FormData
  const isFormData = (typeof FormData !== 'undefined') && (body instanceof FormData);
  if (!isFormData) {
    requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
  }
  if (auth) {
    const token = getAuthToken();
    if (token) requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : await response.text();

  if (!response.ok) {
    const message = isJson ? (data.message || 'Request failed') : (typeof data === 'string' ? data : 'Request failed');
    throw new Error(message);
  }

  return data;
}

window.api = { apiRequest, API_BASE_URL, getAuthToken };


