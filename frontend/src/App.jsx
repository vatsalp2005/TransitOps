import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="vehicles"
          element={
            <ProtectedRoute allowedRoles={['Manager', 'Driver']}>
              <Vehicles />
            </ProtectedRoute>
          }
        />
        <Route
          path="drivers"
          element={
            <ProtectedRoute allowedRoles={['Manager', 'Safety Officer', 'Driver']}>
              <Drivers />
            </ProtectedRoute>
          }
        />
        <Route
          path="trips"
          element={
            <ProtectedRoute allowedRoles={['Manager', 'Driver']}>
              <Trips />
            </ProtectedRoute>
          }
        />
        <Route
          path="maintenance"
          element={
            <ProtectedRoute allowedRoles={['Manager', 'Driver', 'Financial Analyst']}>
              <Maintenance />
            </ProtectedRoute>
          }
        />
        <Route
          path="expenses"
          element={
            <ProtectedRoute allowedRoles={['Manager', 'Financial Analyst']}>
              <Expenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <ProtectedRoute allowedRoles={['Manager', 'Financial Analyst']}>
              <Analytics />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors closeButton theme="light" />
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
