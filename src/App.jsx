import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/DashboardLayout';
import SubmitEntry from './pages/SubmitEntry';
import ViewSubmissions from './pages/ViewSubmissions';
import Users from './pages/Users';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const SuperAdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.type !== 'superadmin') return <Navigate to="/dashboard" />;
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router future={{ v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<ViewSubmissions />} />
            <Route path="submit-entry" element={<SubmitEntry />} />
            <Route path="view-submissions" element={<ViewSubmissions />} />
            <Route 
              path="register" 
              element={
                <SuperAdminRoute>
                  <Register />
                </SuperAdminRoute>
              } 
            />
            <Route 
              path="users" 
              element={
                <SuperAdminRoute>
                  <Users />
                </SuperAdminRoute>
              } 
            />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
