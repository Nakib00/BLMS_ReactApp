import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

// Constants
const API_BASE_URL = 'http://127.0.0.1:8000/api';
const BUSINESS_TYPES = [
  'Technology', 'Manufacturing', 'Retail', 'Healthcare', 'Finance',
  'Education', 'Consulting', 'Software', 'Food Pantry', 'Tax Preparer', 'Other'
];

const STATUS_OPTIONS = [
  'Interested', 'Not Interested', 'Pending', 'In Progress'
];

// Status color mapping
const STATUS_COLORS = {
  'Interested': 'bg-green-100 text-green-800',
  'Not Interested': 'bg-red-100 text-red-800',
  'Pending': 'bg-yellow-100 text-yellow-800',
  'In Progress': 'bg-blue-100 text-blue-800'
};

// Reusable components
const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}`}>
    {status}
  </span>
);

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg">
    {message}
  </div>
);

ErrorMessage.propTypes = {
  message: PropTypes.string.isRequired
};

const ViewSubmissions = () => {
  const { token } = useAuth();
  const [state, setState] = useState({
    submissions: [],
    loading: true,
    error: null,
    selectedUser: null,
    selectedLead: null,
    isEditing: false,
    message: { type: '', text: '' },
    showFilters: false,
    filters: {
      search: '',
      business_type: '',
      status: '',
      location: '',
      from_date: '',
      to_date: ''
    }
  });

  // Memoized filtered submissions
  const filteredSubmissions = useMemo(() => {
    return state.submissions.filter(submission => {
      const matchesSearch = submission.business_name.toLowerCase().includes(state.filters.search.toLowerCase()) ||
        submission.business_email.toLowerCase().includes(state.filters.search.toLowerCase()) ||
        submission.business_phone.includes(state.filters.search);
      
      const matchesBusinessType = !state.filters.business_type || submission.business_type === state.filters.business_type;
      const matchesStatus = !state.filters.status || submission.status === state.filters.status;
      const matchesLocation = !state.filters.location || submission.location.toLowerCase().includes(state.filters.location.toLowerCase());
      
      const submissionDate = new Date(submission.created_at);
      const matchesFromDate = !state.filters.from_date || submissionDate >= new Date(state.filters.from_date);
      const matchesToDate = !state.filters.to_date || submissionDate <= new Date(state.filters.to_date);
      
      return matchesSearch && matchesBusinessType && matchesStatus && matchesLocation && matchesFromDate && matchesToDate;
    });
  }, [state.submissions, state.filters]);

  // Fetch submissions with error handling
  const fetchSubmissions = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(`${API_BASE_URL}/business-leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      
      const data = await response.json();
      setState(prev => ({ ...prev, submissions: data.data, loading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error.message, 
        loading: false 
      }));
    }
  }, [token]);

  // Handle filter changes
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [name]: value }
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {
        search: '',
        business_type: '',
        status: '',
        location: '',
        from_date: '',
        to_date: ''
      }
    }));
  }, []);

  // Handle lead updates
  const handleLeadUpdate = useCallback(async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/business-leads/${state.selectedLead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(state.selectedLead)
      });

      if (!response.ok) {
        throw new Error('Failed to update lead');
      }

      setState(prev => ({
        ...prev,
        message: { type: 'success', text: 'Lead updated successfully' },
        selectedLead: null,
        isEditing: false
      }));
      
      fetchSubmissions();
    } catch (error) {
      setState(prev => ({
        ...prev,
        message: { type: 'error', text: error.message }
      }));
    }
  }, [state.selectedLead, token, fetchSubmissions]);

  // Handle lead deletion
  const handleLeadDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/business-leads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete lead');
      }

      setState(prev => ({
        ...prev,
        message: { type: 'success', text: 'Lead deleted successfully' }
      }));
      
      fetchSubmissions();
    } catch (error) {
      setState(prev => ({
        ...prev,
        message: { type: 'error', text: error.message }
      }));
    }
  }, [token, fetchSubmissions]);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      selectedLead: { ...prev.selectedLead, [name]: value }
    }));
  }, []);

  // Format date helper
  const formatDate = useCallback((dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return dateString;
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Clear message after 3 seconds
  useEffect(() => {
    if (state.message.text) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, message: { type: '', text: '' } }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.message.text]);

  if (state.loading) return <LoadingSpinner />;
  if (state.error) return <ErrorMessage message={state.error} />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Message Alert */}
        {state.message.text && (
          <div className={`mb-4 p-4 rounded-lg ${
            state.message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {state.message.text}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Business Leads</h1>
          <button
            onClick={() => setState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {state.showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Search Bar - Always visible */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              name="search"
              value={state.filters.search}
              onChange={handleFilterChange}
              placeholder="Search by business name, email, or phone..."
              className="w-full px-4 py-3 pl-10 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Advanced Filters - Collapsible */}
        {state.showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                <select
                  name="business_type"
                  value={state.filters.business_type}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {BUSINESS_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={state.filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={state.filters.location}
                  onChange={handleFilterChange}
                  placeholder="Filter by location"
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  name="from_date"
                  value={state.filters.from_date}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  name="to_date"
                  value={state.filters.to_date}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {state.loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Loading submissions...</p>
            </div>
          ) : state.error ? (
            <div className="p-8 text-center text-red-600">
              {state.error}
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-gray-600">No submissions found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Info</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{submission.business_name}</div>
                        <div className="text-sm text-gray-500">{submission.business_type}</div>
                        {submission.website_url && (
                          <a
                            href={submission.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-1"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Visit Website
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{submission.business_email}</div>
                        <div className="text-sm text-gray-500">{submission.business_phone}</div>
                        <div className="text-sm text-gray-500">{submission.location}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={submission.status} />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setState(prev => ({ ...prev, selectedUser: submission.user }))}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {submission.user?.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(submission.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setState(prev => ({ ...prev, selectedLead: submission, isEditing: false }));
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setState(prev => ({ ...prev, selectedLead: submission, isEditing: true }));
                            }}
                            className="text-green-600 hover:text-green-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleLeadDelete(submission.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Lead Details/Edit Modal */}
      {state.selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {state.isEditing ? 'Edit Lead' : 'Lead Details'}
                </h3>
                <button
                  onClick={() => {
                    setState(prev => ({ ...prev, selectedLead: null, isEditing: false }));
                  }}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleLeadUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Name</label>
                    <input
                      type="text"
                      name="business_name"
                      value={state.selectedLead.business_name}
                      onChange={handleInputChange}
                      disabled={!state.isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Type</label>
                    <select
                      name="business_type"
                      value={state.selectedLead.business_type}
                      onChange={handleInputChange}
                      disabled={!state.isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {BUSINESS_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="business_email"
                      value={state.selectedLead.business_email || ''}
                      onChange={handleInputChange}
                      disabled={!state.isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="text"
                      name="business_phone"
                      value={state.selectedLead.business_phone || ''}
                      onChange={handleInputChange}
                      disabled={!state.isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <input
                      type="url"
                      name="website_url"
                      value={state.selectedLead.website_url || ''}
                      onChange={handleInputChange}
                      disabled={!state.isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={state.selectedLead.location || ''}
                      onChange={handleInputChange}
                      disabled={!state.isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Source of Data</label>
                    <input
                      type="text"
                      name="source_of_data"
                      value={state.selectedLead.source_of_data || ''}
                      onChange={handleInputChange}
                      disabled={!state.isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      name="status"
                      value={state.selectedLead.status}
                      onChange={handleInputChange}
                      disabled={!state.isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    name="note"
                    rows="4"
                    value={state.selectedLead.note || ''}
                    onChange={handleInputChange}
                    disabled={!state.isEditing}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>

                {state.isEditing && (
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setState(prev => ({ ...prev, isEditing: false }))}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {state.selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">User Profile</h3>
                <button
                  onClick={() => setState(prev => ({ ...prev, selectedUser: null }))}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6">
                {/* User Image Section */}
                <div className="flex-shrink-0">
                  {state.selectedUser.profile_image ? (
                    <img
                      src={`http://127.0.0.1:8000/storage/${state.selectedUser.profile_image}`}
                      alt={state.selectedUser.name}
                      className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(state.selectedUser.name)}&background=3B82F6&color=ffffff&size=128`;
                      }}
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-4xl font-semibold text-blue-600">
                        {state.selectedUser.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* User Details Section */}
                <div className="flex-grow space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Full Name</p>
                          <p className="text-sm text-gray-900">{state.selectedUser.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <p className="text-sm text-gray-900">{state.selectedUser.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone</p>
                          <p className="text-sm text-gray-900">{state.selectedUser.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Role</p>
                          <p className="text-sm text-gray-900 capitalize">{state.selectedUser.role || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Address</p>
                          <p className="text-sm text-gray-900">{state.selectedUser.address || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Joined Date</p>
                          <p className="text-sm text-gray-900">{formatDate(state.selectedUser.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {state.selectedUser.bio && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500">Bio</p>
                      <p className="mt-1 text-sm text-gray-900">{state.selectedUser.bio}</p>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="mt-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      state.selectedUser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {state.selectedUser.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="px-4 py-2 bg-gray-50 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">Total Leads</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900">{state.selectedUser.total_leads || 0}</dd>
                  </div>
                  <div className="px-4 py-2 bg-gray-50 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">Active Leads</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900">{state.selectedUser.active_leads || 0}</dd>
                  </div>
                  <div className="px-4 py-2 bg-gray-50 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">Success Rate</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900">
                      {state.selectedUser.success_rate ? `${state.selectedUser.success_rate}%` : 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewSubmissions; 