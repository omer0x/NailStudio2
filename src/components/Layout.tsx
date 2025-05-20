import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  
  // Check if we're in the admin section
  const isAdminSection = location.pathname.startsWith('/admin');
  
  // Set appropriate background color based on the section
  const backgroundColor = isAdminSection
    ? 'bg-[#f0f0f0]'
    : 'bg-gradient-to-b from-[#d4c8a9] via-[#f0f0f0] to-[#f0f0f0]';

  return (
    <div className={`min-h-screen flex flex-col ${backgroundColor} transition-colors duration-300`}>
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6 md:py-8">
        {isAdmin && isAdminSection && (
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h1>
            <div className="flex overflow-x-auto pb-2 mt-3 -mx-4 px-4 gap-2">
              <a 
                href="/admin" 
                className={`px-4 py-2 whitespace-nowrap rounded-full text-sm font-medium ${
                  location.pathname === '/admin' 
                    ? 'bg-primary text-neutral-light' 
                    : 'bg-white text-neutral-dark hover:bg-primary-light/50'
                } shadow-sm transition-colors`}
              >
                Dashboard
              </a>
              <a 
                href="/admin/appointments" 
                className={`px-4 py-2 whitespace-nowrap rounded-full text-sm font-medium ${
                  location.pathname === '/admin/appointments' 
                    ? 'bg-primary text-neutral-light' 
                    : 'bg-white text-neutral-dark hover:bg-primary-light/50'
                } shadow-sm transition-colors`}
              >
                Appointments
              </a>
              <a 
                href="/admin/services" 
                className={`px-4 py-2 whitespace-nowrap rounded-full text-sm font-medium ${
                  location.pathname === '/admin/services' 
                    ? 'bg-primary text-neutral-light' 
                    : 'bg-white text-neutral-dark hover:bg-primary-light/50'
                } shadow-sm transition-colors`}
              >
                Services
              </a>
              <a 
                href="/admin/time-slots" 
                className={`px-4 py-2 whitespace-nowrap rounded-full text-sm font-medium ${
                  location.pathname === '/admin/time-slots' 
                    ? 'bg-primary text-neutral-light' 
                    : 'bg-white text-neutral-dark hover:bg-primary-light/50'
                } shadow-sm transition-colors`}
              >
                Time Slots
              </a>
              <a 
                href="/admin/users" 
                className={`px-4 py-2 whitespace-nowrap rounded-full text-sm font-medium ${
                  location.pathname === '/admin/users' 
                    ? 'bg-primary text-neutral-light' 
                    : 'bg-white text-neutral-dark hover:bg-primary-light/50'
                } shadow-sm transition-colors`}
              >
                Users
              </a>
            </div>
            <div className="border-b border-gray-200 mt-2"></div>
          </div>
        )}
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;