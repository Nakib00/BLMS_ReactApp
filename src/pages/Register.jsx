import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    address: '',
    type: '',
    profile_image: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const userTypes = [
    { value: 'admin', label: 'Admin' },
    { value: 'leader', label: 'Leader' },
    { value: 'member', label: 'Member' },
    { value: 'client', label: 'Client' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profile_image: file
      }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch('https://hubbackend.desklago.com/api/register', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Register New User</h2>
              <p className="mt-2 text-sm text-gray-600">Create a new user account for the system</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password_confirmation"
                      name="password_confirmation"
                      type="password"
                      required
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <div className="mt-1">
                    <input
                      id="address"
                      name="address"
                      type="text"
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="123 Main St, City, Country"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* User Type */}
                <div className="sm:col-span-2">
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    User Type
                  </label>
                  <div className="mt-1">
                    <select
                      id="type"
                      name="type"
                      required
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={formData.type}
                      onChange={handleChange}
                    >
                      <option value="">Select User Type</option>
                      {userTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Profile Image */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Profile Image
                  </label>
                  <div className="mt-1 flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                      />
                    </div>
                    {previewImage && (
                      <div className="flex-shrink-0">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Registering...
                    </span>
                  ) : (
                    'Register User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 