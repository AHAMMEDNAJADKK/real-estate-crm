import axios from 'axios';

const normalizeApiBaseUrl = (rawUrl) => {
  const trimmed = (rawUrl || '/api').trim().replace(/^["']+|["']+$/g, '').replace(/\/+$/, '');
  if (!trimmed || trimmed === '/api') return '/api';

  const isLocalTarget = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(trimmed);
  const isRemoteBrowserHost =
    typeof window !== 'undefined' &&
    window.location?.hostname &&
    !/^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);

  if (isLocalTarget && (import.meta.env.PROD || isRemoteBrowserHost)) {
    return '/api';
  }

  if (/\/api(\/v\d+)?$/i.test(trimmed)) return trimmed;
  return `${trimmed}/api`;
};

export const API_BASE = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
export const BACKEND_ORIGIN = API_BASE.replace(/\/api(\/v\d+)?$/i, '');

export const resolveUploadUrl = (fileUrl) => {
  if (!fileUrl) return '';
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  return BACKEND_ORIGIN ? `${BACKEND_ORIGIN}${normalizedPath}` : normalizedPath;
};

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});


apiClient.interceptors.request.use(
  (config) => {
    const isLoginRequest = config.url && /\/auth\/login$/i.test(config.url);
    if (!isLoginRequest) {
      const rawToken = localStorage.getItem('token');
      const token = rawToken
        ? rawToken
            .replace(/^"(.*)"$/, '$1')
            .replace(/"/g, '')
            .replace(/^Bearer\s+/i, '')
            .trim()
        : '';
      if (token && !['undefined', 'null'].includes(token.toLowerCase())) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
