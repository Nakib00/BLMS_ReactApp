import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const SubmitEntry = () => {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: '',
    business_type_other: '',
    business_email: '',
    business_phone: '',
    website_url: '',
    location: '',
    source_of_data: '',
    source_of_data_other: '',
    status: '',
    note: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const businessTypes = [
    'Technology',
    'Manufacturing',
    'Retail',
    'Healthcare',
    'Finance',
    'Education',
    'Consulting',
    'Software',
    'Food Pantry',
    'Tax Preparer',
    'Other'
  ];

  const sourceOfDataOptions = [
    'Website Contact Form',
    'Trade Show',
    'Referral',
    'Email Campaign',
    'Cold Call',
    'Google Search',
    'LinkedIn',
    'Yelp',
    'Yellow Page',
    'BBB (Better Business Bureau)',
    'Chamber of Commerce',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'business_type' && value !== 'Other' && { business_type_other: '' }),
      ...(name === 'source_of_data' && value !== 'Other' && { source_of_data_other: '' })
    }));
    // Clear validation error when field is changed
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    setValidationErrors({});

    try {
      // Client-side validation
      const errors = {};
      if (!formData.business_name?.trim()) {
        errors.business_name = 'Business name is required';
      }
      if (!formData.business_type) {
        errors.business_type = 'Business type is required';
      }
      if (formData.business_type === 'Other' && !formData.business_type_other?.trim()) {
        errors.business_type_other = 'Please specify the business type';
      }
      if (!formData.status) {
        errors.status = 'Status is required';
      }
      if (formData.business_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.business_email)) {
        errors.business_email = 'Please enter a valid email address';
      }
      if (formData.website_url && !/^https?:\/\/.*/.test(formData.website_url)) {
        errors.website_url = 'Please enter a valid URL starting with http:// or https://';
      }

      if (!user?.id) {
        setMessage({ type: 'error', text: 'User not authenticated. Please log in again.' });
        return;
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setMessage({ type: 'error', text: 'Please correct the errors below' });
        return;
      }

      const submissionData = {
        business_name: formData.business_name.trim(),
        business_type: formData.business_type === 'Other' ? formData.business_type_other.trim() : formData.business_type,
        business_email: formData.business_email?.trim() || null,
        business_phone: formData.business_phone?.trim() || null,
        website_url: formData.website_url?.trim() || null,
        location: formData.location?.trim() || null,
        source_of_data: formData.source_of_data === 'Other' ? formData.source_of_data_other.trim() : formData.source_of_data || null,
        status: formData.status,
        note: formData.note?.trim() || null,
        user_id: user.id
      };

      console.log('Submitting data:', submissionData);
      console.log('Using token:', token);

      const response = await fetch('https://hubbackend.desklago.com/api/business-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(submissionData),
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Entry submitted successfully!' });
        setFormData({
          business_name: '',
          business_type: '',
          business_type_other: '',
          business_email: '',
          business_phone: '',
          website_url: '',
          location: '',
          source_of_data: '',
          source_of_data_other: '',
          status: '',
          note: '',
        });
      } else {
        // Handle validation errors from backend
        if (response.status === 422 && data.errors) {
          const backendErrors = {};
          Object.keys(data.errors).forEach(key => {
            backendErrors[key] = data.errors[key][0]; // Get first error message for each field
          });
          setValidationErrors(backendErrors);
          setMessage({ type: 'error', text: 'Please correct the errors below' });
        } else {
          setMessage({ 
            type: 'error', 
            text: data.message || 'Failed to submit entry. Please check your input and try again.' 
          });
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Network error occurred. Please check your connection and try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClassName = (fieldName) => `
    w-full px-4 py-2 border rounded-lg transition duration-150
    ${validationErrors[fieldName] 
      ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-transparent' 
      : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'}
  `;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Submit Business Lead Entry</h2>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business Name */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="business_name"
                required
                value={formData.business_name}
                onChange={handleChange}
                className={getInputClassName('business_name')}
                placeholder="Enter business name"
              />
              {validationErrors.business_name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.business_name}</p>
              )}
            </div>

            {/* Business Type */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Type <span className="text-red-500">*</span>
              </label>
              <select
                name="business_type"
                required
                value={formData.business_type}
                onChange={handleChange}
                className={getInputClassName('business_type')}
              >
                <option value="">Select Business Type</option>
                {businessTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {validationErrors.business_type && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.business_type}</p>
              )}
              {formData.business_type === 'Other' && (
                <div className="mt-2">
                  <input
                    type="text"
                    name="business_type_other"
                    value={formData.business_type_other}
                    onChange={handleChange}
                    placeholder="Specify business type"
                    className={getInputClassName('business_type_other')}
                    required
                  />
                  {validationErrors.business_type_other && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.business_type_other}</p>
                  )}
                </div>
              )}
            </div>

            {/* Business Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
              <input
                type="email"
                name="business_email"
                value={formData.business_email}
                onChange={handleChange}
                className={getInputClassName('business_email')}
                placeholder="Enter business email"
              />
              {validationErrors.business_email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.business_email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="text"
                name="business_phone"
                value={formData.business_phone}
                onChange={handleChange}
                className={getInputClassName('business_phone')}
                placeholder="Enter phone number"
              />
              {validationErrors.business_phone && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.business_phone}</p>
              )}
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <input
                type="url"
                name="website_url"
                value={formData.website_url}
                onChange={handleChange}
                className={getInputClassName('website_url')}
                placeholder="https://example.com"
              />
              {validationErrors.website_url && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.website_url}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={getInputClassName('location')}
                placeholder="Enter business location"
              />
              {validationErrors.location && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
              )}
            </div>

            {/* Source of Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Source of Data</label>
              <select
                name="source_of_data"
                value={formData.source_of_data}
                onChange={handleChange}
                className={getInputClassName('source_of_data')}
              >
                <option value="">Select Source</option>
                {sourceOfDataOptions.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
              {validationErrors.source_of_data && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.source_of_data}</p>
              )}
              {formData.source_of_data === 'Other' && (
                <div className="mt-2">
                  <input
                    type="text"
                    name="source_of_data_other"
                    value={formData.source_of_data_other}
                    onChange={handleChange}
                    placeholder="Specify source of data"
                    className={getInputClassName('source_of_data_other')}
                    required
                  />
                  {validationErrors.source_of_data_other && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.source_of_data_other}</p>
                  )}
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                required
                value={formData.status}
                onChange={handleChange}
                className={getInputClassName('status')}
              >
                <option value="">Select Status</option>
                <option value="Interested">Interested</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
              </select>
              {validationErrors.status && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.status}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              name="note"
              rows="4"
              value={formData.note}
              onChange={handleChange}
              className={getInputClassName('note')}
              placeholder="Add any additional notes here..."
            ></textarea>
            {validationErrors.note && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.note}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 text-white font-medium rounded-lg transition duration-150 ${
                isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Entry'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitEntry; 