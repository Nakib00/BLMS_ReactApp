import { API_BASE_URL, API_ENDPOINTS } from '../constants';

class ApiService {
  constructor() {
    this.baseUrl = 'https://hubbackend.desklago.com/api';
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials) {
    return this.request(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async register(userData) {
    return this.request(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async logout() {
    return this.request(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST'
    });
  }

  async getProfile() {
    return this.request(API_ENDPOINTS.AUTH.PROFILE);
  }

  // Business Leads endpoints
  async getBusinessLeads(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`${API_ENDPOINTS.BUSINESS_LEADS.LIST}?${queryParams}`);
  }

  async createBusinessLead(leadData) {
    return this.request(API_ENDPOINTS.BUSINESS_LEADS.CREATE, {
      method: 'POST',
      body: JSON.stringify(leadData)
    });
  }

  async updateBusinessLead(id, leadData) {
    return this.request(API_ENDPOINTS.BUSINESS_LEADS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(leadData)
    });
  }

  async deleteBusinessLead(id) {
    return this.request(API_ENDPOINTS.BUSINESS_LEADS.DELETE(id), {
      method: 'DELETE'
    });
  }

  async getBusinessLeadStats() {
    return this.request(API_ENDPOINTS.BUSINESS_LEADS.STATS);
  }
}

export const apiService = new ApiService();