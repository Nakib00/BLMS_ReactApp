import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg p-5">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <div className="rounded-md bg-blue-500 p-3">
          {icon}
        </div>
      </div>
      <div className="ml-5 w-0 flex-1">
        <dl>
          <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
          <dd className="text-2xl font-semibold text-gray-900">{value}</dd>
        </dl>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [leadCount, setLeadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Determine which API endpoint to use based on user type
        const leadCountUrl = user?.type === 'superadmin' 
          ? 'https://hubbackend.desklago.com/api/business-leads/leads/count'
          : `https://hubbackend.desklago.com/api/business-leads/count/${user?.id}`;

        const leadCountResponse = await fetch(leadCountUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!leadCountResponse.ok) {
          throw new Error('Failed to fetch lead count');
        }

        const leadCountData = await leadCountResponse.json();
        // Set lead count based on response structure
        setLeadCount(user?.type === 'superadmin' ? leadCountData.total_leads : leadCountData.lead_count);

        // Fetch other stats for admin/superadmin
        if (['superadmin'].includes(user?.type)) {
          const response = await fetch('https://hubbackend.desklago.com/api/business-leads/leads/count', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch statistics for');
          }

          const data = await response.json();
          console.log('Statistics data:', data);
          setStats(data.data);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token && user?.id) {
      fetchData();
    }
  }, [user, token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  // Client view
  if (user?.type === 'client') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to BLMS
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          Thank you for using our Business Lead Management System. Here you can view and track business leads and their progress.
        </p>
      </div>
    );
  }

  // Admin/Superadmin/Leader/Member view
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard Overview</h1>
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Leads"
            value={leadCount}
            icon={
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          
          {['superadmin', 'admin'].includes(user?.type) && (
            <>
              <StatCard
                title="Interested Leads"
                value={stats?.interested_leads || 0}
                icon={
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                }
              />
              
              <StatCard
                title="In Progress Leads"
                value={stats?.in_progress_leads || 0}
                icon={
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
            </>
          )}
        </div>

        {stats?.recent_activities && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h2>
            <div className="bg-white shadow overflow-hidden rounded-lg">
              {/* Add recent activities section if needed */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;