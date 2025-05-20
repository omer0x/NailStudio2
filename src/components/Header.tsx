import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Instagram, User, Calendar, LogOut, Home, Settings, ShieldCheck } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close mobile menu when location changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  const isAdminSection = location.pathname.startsWith('/admin');
  
  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white shadow-md py-2' 
        : 'bg-transparent py-4'
    }`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl md:text-2xl font-semibold text-primary">
            Medina Nails
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className={`text-sm font-medium ${
            location.pathname === '/' 
              ? 'text-primary' 
              : 'text-neutral-dark hover:text-primary'
          } transition-colors`}>
            Home
          </Link>
          
          {user ? (
            <>
              <Link to="/book" className={`text-sm font-medium ${
                location.pathname === '/book' 
                  ? 'text-primary' 
                  : 'text-neutral-dark hover:text-primary'
              } transition-colors`}>
                Book Appointment
              </Link>
              <Link to="/my-appointments" className={`text-sm font-medium ${
                location.pathname === '/my-appointments' 
                  ? 'text-primary' 
                  : 'text-neutral-dark hover:text-primary'
              } transition-colors`}>
                My Appointments
              </Link>

              {isAdmin && (
                <Link 
                  to="/admin"
                  className={`text-sm font-medium flex items-center ${
                    isAdminSection 
                      ? 'text-primary' 
                      : 'text-neutral-dark hover:text-primary'
                  } transition-colors`}
                >
                  <ShieldCheck size={16} className="mr-1" />
                  Admin Dashboard
                </Link>
              )}
              
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-neutral-dark hover:text-primary transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`text-sm font-medium ${
                location.pathname === '/login' 
                  ? 'text-primary' 
                  : 'text-neutral-dark hover:text-primary'
              } transition-colors`}>
                Login
              </Link>
              <Link to="/register" className="px-4 py-2 rounded-full bg-primary text-neutral-light text-sm font-medium hover:bg-primary/90 transition-colors">
                Register
              </Link>
            </>
          )}
          
          <a 
            href="https://www.instagram.com/medinanails.studio/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-dark hover:text-primary transition-colors"
          >
            <Instagram size={20} />
          </a>
        </nav>
        
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-neutral-dark hover:text-primary transition-colors"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg animate-fadeIn">
          <nav className="container mx-auto py-4 px-4 flex flex-col space-y-4">
            <Link to="/" className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-pink-50">
              <Home size={20} className="text-primary" />
              <span className="text-neutral-dark">Home</span>
            </Link>
            
            {user ? (
              <>
                <Link to="/book" className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-pink-50">
                  <Calendar size={20} className="text-pink-600" />
                  <span className="text-gray-700">Book Appointment</span>
                </Link>
                <Link to="/my-appointments" className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-pink-50">
                  <User size={20} className="text-pink-600" />
                  <span className="text-gray-700">My Appointments</span>
                </Link>
                
                {isAdmin && (
                  <Link to="/admin" className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-pink-50">
                    <Settings size={20} className="text-pink-600" />
                    <span className="text-gray-700">Admin Dashboard</span>
                  </Link>
                )}
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-pink-50 w-full text-left"
                >
                  <LogOut size={20} className="text-pink-600" />
                  <span className="text-gray-700">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-pink-50">
                  <User size={20} className="text-pink-600" />
                  <span className="text-gray-700">Login</span>
                </Link>
                <Link to="/register" className="py-2 px-4 rounded-lg bg-pink-600 text-white text-center">
                  Register
                </Link>
              </>
            )}
            
            <a 
              href="https://www.instagram.com/medinanails.studio/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-pink-50"
            >
              <Instagram size={20} className="text-pink-600" />
              <span className="text-gray-700">Instagram</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;