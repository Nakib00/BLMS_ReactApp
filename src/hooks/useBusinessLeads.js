import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

export const useBusinessLeads = (initialFilters = {}) => {
  const [state, setState] = useState({
    leads: [],
    loading: true,
    error: null,
    filters: initialFilters,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0
    }
  });

  const fetchLeads = useCallback(async (filters = state.filters) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await apiService.getBusinessLeads(filters);
      setState(prev => ({
        ...prev,
        leads: response.data,
        loading: false,
        pagination: {
          currentPage: response.meta?.current_page || 1,
          totalPages: response.meta?.last_page || 1,
          totalItems: response.meta?.total || 0
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    }
  }, [state.filters]);

  const updateFilters = useCallback((newFilters) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  }, []);

  const createLead = useCallback(async (leadData) => {
    try {
      const response = await apiService.createBusinessLead(leadData);
      await fetchLeads();
      return response;
    } catch (error) {
      throw error;
    }
  }, [fetchLeads]);

  const updateLead = useCallback(async (id, leadData) => {
    try {
      const response = await apiService.updateBusinessLead(id, leadData);
      await fetchLeads();
      return response;
    } catch (error) {
      throw error;
    }
  }, [fetchLeads]);

  const deleteLead = useCallback(async (id) => {
    try {
      await apiService.deleteBusinessLead(id);
      await fetchLeads();
    } catch (error) {
      throw error;
    }
  }, [fetchLeads]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads: state.leads,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    pagination: state.pagination,
    fetchLeads,
    updateFilters,
    createLead,
    updateLead,
    deleteLead
  };
}; 