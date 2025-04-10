export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const APP_NAME = import.meta.env.VITE_APP_NAME;
export const APP_VERSION = import.meta.env.VITE_APP_VERSION;

export const BUSINESS_TYPES = [
  'Technology', 'Manufacturing', 'Retail', 'Healthcare', 'Finance',
  'Education', 'Consulting', 'Software', 'Food Pantry', 'Tax Preparer', 'Other'
];

export const STATUS_OPTIONS = [
  'Pending', 'Accepted', 'Incomplete'
];

export const STATUS_COLORS = {
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Accepted': 'bg-green-100 text-green-800',
  'Incomplete': 'bg-red-100 text-red-800'
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  SUBMIT_ENTRY: '/submit-entry',
  VIEW_SUBMISSIONS: '/view-submissions',
  PROFILE: '/profile'
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile'
  },
  BUSINESS_LEADS: {
    LIST: '/business-leads',
    CREATE: '/business-leads',
    UPDATE: (id) => `/business-leads/${id}`,
    DELETE: (id) => `/business-leads/${id}`,
    STATS: '/business-leads/stats'
  }
};

export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
  THEME: 'theme_preference'
};

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s-]{10,}$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
};