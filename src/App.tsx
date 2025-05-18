import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const BookAppointment = lazy(() => import('./pages/BookAppointment'));
const MyAppointments = lazy(() => import('./pages/MyAppointments'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminServices = lazy(() => import('./pages/admin/Services'));
const AdminAppointments = lazy(() => import('./pages/admin/Appointments'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminTimeSlots = lazy(() => import('./pages/admin/TimeSlots'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Check if Supabase is connected and auth is initialized
    const initApp = async () => {
      try {
        await supabase.auth.getSession();
        setAppReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setAppReady(true); // Still mark as ready so users can see error state
      }
    };

    initApp();
  }, []);

  if (!appReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/book" element={
                <ProtectedRoute>
                  <BookAppointment />
                </ProtectedRoute>
              } />
              <Route path="/my-appointments" element={
                <ProtectedRoute>
                  <MyAppointments />
                </ProtectedRoute>
              } />
              
              {/* Admin routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              <Route path="/admin/services" element={
                <AdminRoute>
                  <AdminServices />
                </AdminRoute>
              } />
              <Route path="/admin/appointments" element={
                <AdminRoute>
                  <AdminAppointments />
                </AdminRoute>
              } />
              <Route path="/admin/users" element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              } />
              <Route path="/admin/time-slots" element={
                <AdminRoute>
                  <AdminTimeSlots />
                </AdminRoute>
              } />
              
              {/* Fallback routes */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;