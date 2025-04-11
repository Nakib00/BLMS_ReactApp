import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

// Constants
const API_BASE_URL = 'https://hubbackend.desklago.com/api';
const ITEMS_PER_PAGE = 10;
const BUSINESS_TYPES = [
  'Technology', 'Manufacturing', 'Retail', 'Healthcare', 'Finance',
  'Education', 'Consulting', 'Software', 'Food Pantry', 'Tax Preparer', 'Other'
];

const STATUS_OPTIONS = [
  'Interested', 'Not Interested', 'Pending', 'In Progress'
];

// Status color mapping
const STATUS_COLORS = {
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Accepted': 'bg-green-100 text-green-800',
  'Incomplete': 'bg-red-100 text-red-800'
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
  const { token, user } = useAuth();
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
    },
    pagination: {
      currentPage: 1,
      perPage: ITEMS_PER_PAGE,
      totalPages: 1,
      totalItems: 0
    },
    isFiltering: false
  });

  // Function to determine which columns to show based on user type and subscription
  const getVisibleColumns = useCallback(() => {
    if (user?.type?.toLowerCase() === 'client') {
      if (user.is_subscribe === "1") {
        return ['business_info', 'contact', 'status', 'created_by', 'date'];
      }
      return ['business_info', 'status', 'created_by', 'date'];
    }
    return ['business_info', 'contact', 'status', 'created_by', 'date', 'actions'];
  }, [user]);

  // Fetch submissions with error handling
  const fetchSubmissions = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const queryParams = new URLSearchParams({
        page: state.pagination.currentPage.toString(),
        per_page: ITEMS_PER_PAGE.toString(),
        ...(state.filters.search && { search: state.filters.search }),
        ...(state.filters.business_type && { business_type: state.filters.business_type }),
        ...(state.filters.status && { status: state.filters.status }),
        ...(state.filters.location && { location: state.filters.location }),
        ...(state.filters.from_date && { from_date: state.filters.from_date }),
        ...(state.filters.to_date && { to_date: state.filters.to_date })
      });

      // Add user_id filter for leader and member roles
      if (user?.type && ['leader', 'member'].includes(user.type.toLowerCase())) {
        queryParams.append('user_id', user.id);
      }

      const response = await fetch(`${API_BASE_URL}/business-leads/${user?.id}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch submissions');
      }
      
      const data = await response.json();
      
      // Filter data based on user role if needed (in case backend doesn't handle it)
      let submissions = data.data || [];
      if (user?.type && ['leader', 'member'].includes(user.type.toLowerCase())) {
        submissions = submissions.filter(submission => submission.user_id === user.id);
      }

      setState(prev => ({ 
        ...prev, 
        submissions,
        loading: false,
        pagination: {
          ...prev.pagination,
          currentPage: parseInt(data.pagination?.current_page) || 1,
          totalPages: Math.ceil((data.pagination?.total_rows || 0) / ITEMS_PER_PAGE),
          totalItems: data.pagination?.total_rows || 0
        }
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to fetch submissions', 
        loading: false,
        submissions: []
      }));
    }
  }, [token, state.pagination.currentPage, state.filters, user]);

  // Handle filter changes
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [name]: value },
      pagination: { ...prev.pagination, currentPage: 1 }, // Reset to first page when filter changes
      isFiltering: true
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
      },
      pagination: { ...prev.pagination, currentPage: 1 }, // Reset to first page when clearing filters
      isFiltering: false
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
  }, [state.selectedLead, token, fetchSubmissions, user]);

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
  }, [token, fetchSubmissions, user]);

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

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, currentPage: newPage }
    }));
  }, []);

  // Effect to fetch data when filters or pagination changes
  useEffect(() => {
    fetchSubmissions();
  }, [
    fetchSubmissions,
    state.filters.search,
    state.filters.business_type,
    state.filters.status,
    state.filters.location,
    state.filters.from_date,
    state.filters.to_date,
    state.pagination.currentPage,
    state.pagination.perPage
  ]);

  // Clear message after 3 seconds
  useEffect(() => {
    if (state.message.text) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, message: { type: '', text: '' } }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.message.text]);

  // User Info Popup
  const UserInfoPopup = ({ user, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">User Information</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex items-center space-x-4 mb-4">
          {user.profile_image ? (
            <img
              src={`https://hubbackend.desklago.com/storage/${user.profile_image}`}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-xl">{user.name.charAt(0)}</span>
            </div>
          )}
          <div>
            <h4 className="text-lg font-medium">{user.name}</h4>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p><span className="font-medium">Phone:</span> {user.phone}</p>
          <p><span className="font-medium">Address:</span> {user.address}</p>
          <p><span className="font-medium">Type:</span> {user.type}</p>
          <p><span className="font-medium">Status:</span> {user.is_suspended === "0" ? "Active" : "Suspended"}</p>
        </div>
      </div>
    </div>
  );

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

        {/* Filters Section */}
        <div className="mb-6">
          {state.showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow">
              <input
                type="text"
                name="search"
                value={state.filters.search}
                onChange={handleFilterChange}
                placeholder="Search by name, email, or phone"
                className="border rounded p-2"
              />
              <select
                name="business_type"
                value={state.filters.business_type}
                onChange={handleFilterChange}
                className="border rounded p-2"
              >
                <option value="">All Business Types</option>
                {BUSINESS_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                name="status"
                value={state.filters.status}
                onChange={handleFilterChange}
                className="border rounded p-2"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Incomplete">Incomplete</option>
              </select>
              <input
                type="text"
                name="location"
                value={state.filters.location}
                onChange={handleFilterChange}
                placeholder="Filter by location"
                className="border rounded p-2"
              />
              <input
                type="date"
                name="from_date"
                value={state.filters.from_date}
                onChange={handleFilterChange}
                className="border rounded p-2"
              />
              <input
                type="date"
                name="to_date"
                value={state.filters.to_date}
                onChange={handleFilterChange}
                className="border rounded p-2"
              />
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

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
          ) : state.submissions.length === 0 ? (
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
                    {getVisibleColumns().includes('business_info') && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Info</th>
                    )}
                    {getVisibleColumns().includes('contact') && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    )}
                    {getVisibleColumns().includes('status') && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    )}
                    {getVisibleColumns().includes('created_by') && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                    )}
                    {getVisibleColumns().includes('date') && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    )}
                    {getVisibleColumns().includes('actions') && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {state.submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50 transition-colors duration-150">
                      {getVisibleColumns().includes('business_info') && (
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{submission.business_name}</div>
                          <div className="text-sm text-gray-500">{submission.business_type}</div>
                          {(user?.type !== 'client' || user?.is_subscribe === "1") && submission.website_url && (
                            <a href={submission.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
                              Visit Website
                            </a>
                          )}
                        </td>
                      )}
                      {getVisibleColumns().includes('contact') && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{submission.business_email}</div>
                          <div className="text-sm text-gray-500">{submission.business_phone}</div>
                          <div className="text-sm text-gray-500">{submission.location}</div>
                        </td>
                      )}
                      {getVisibleColumns().includes('status') && (
                        <td className="px-6 py-4">
                          <StatusBadge status={submission.status} />
                        </td>
                      )}
                      {getVisibleColumns().includes('created_by') && (
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
                      )}
                      {getVisibleColumns().includes('date') && (
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(submission.created_at)}
                        </td>
                      )}
                      {getVisibleColumns().includes('actions') && (
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
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {Math.min((state.pagination.currentPage - 1) * ITEMS_PER_PAGE + 1, state.pagination.totalItems)} to{' '}
            {Math.min(state.pagination.currentPage * ITEMS_PER_PAGE, state.pagination.totalItems)} of{' '}
            {state.pagination.totalItems} entries
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(state.pagination.currentPage - 1)}
              disabled={state.pagination.currentPage === 1}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Previous
            </button>
            <div className="flex items-center space-x-2">
              {Array.from({ length: state.pagination.totalPages }, (_, i) => i + 1)
                .filter(page => {
                  const current = state.pagination.currentPage;
                  return page === 1 || 
                         page === state.pagination.totalPages || 
                         (page >= current - 1 && page <= current + 1);
                })
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 py-2">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 border text-sm font-medium rounded-md ${
                        page === state.pagination.currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
            </div>
            <button
              onClick={() => handlePageChange(state.pagination.currentPage + 1)}
              disabled={state.pagination.currentPage === state.pagination.totalPages}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Next
            </button>
          </div>
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
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Incomplete">Incomplete</option>
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
        <UserInfoPopup user={state.selectedUser} onClose={() => setState(prev => ({ ...prev, selectedUser: null }))} />
      )}
    </div>
  );
};

export default ViewSubmissions;