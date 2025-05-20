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
        ? 'bg-[#d4c8a9]/95 backdrop-blur-sm shadow-md py-2' 
        : 'bg-transparent py-6'
    }`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <div className="relative">
            <span className="text-xl md:text-2xl font-bold text-[#6e5d46] tracking-wide">
              Medina
            </span>
            <span className="absolute -bottom-3 right-0 text-sm font-medium text-[#6e5d46]/70">
              NAILS STUDIO
            </span>
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#6e5d46]"></div>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className={`text-sm font-medium ${
            location.pathname === '/' 
              ? 'text-[#6e5d46]' 
              : 'text-[#6e5d46]/80 hover:text-[#6e5d46]'
          } transition-colors`}>
            Home
          </Link>
          
          {user ? (
            <>
              <Link to="/book" className={`text-sm font-medium ${
                location.pathname === '/book' 
                  ? 'text-[#6e5d46]' 
                  : 'text-[#6e5d46]/80 hover:text-[#6e5d46]'
              } transition-colors`}>
                Book Appointment
              </Link>
              <Link to="/my-appointments" className={`text-sm font-medium ${
                location.pathname === '/my-appointments' 
                  ? 'text-[#6e5d46]' 
                  : 'text-[#6e5d46]/80 hover:text-[#6e5d46]'
              } transition-colors`}>
                My Appointments
              </Link>

              {isAdmin && (
                <Link 
                  to="/admin"
                  className={`text-sm font-medium flex items-center ${
                    isAdminSection 
                      ? 'text-[#6e5d46]' 
                      : 'text-[#6e5d46]/80 hover:text-[#6e5d46]'
                  } transition-colors`}
                >
                  <ShieldCheck size={16} className="mr-1" />
                  Admin Dashboard
                </Link>
              )}
              
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-[#6e5d46]/80 hover:text-[#6e5d46] transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`text-sm font-medium ${
                location.pathname === '/login' 
                  ? 'text-[#6e5d46]' 
                  : 'text-[#6e5d46]/80 hover:text-[#6e5d46]'
              } transition-colors`}>
                Login
              </Link>
              <Link to="/register" className="px-6 py-2.5 rounded-full bg-[#6e5d46] text-[#d4c8a9] text-sm font-medium hover:bg-[#6e5d46]/90 transition-colors">
                Register
              </Link>
            </>
          )}
          
          <a 
            href="https://www.instagram.com/medinanails.studio/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6e5d46]/80 hover:text-[#6e5d46] transition-colors"
          >
            <Instagram size={20} />
          </a>
        </nav>
        
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-[#6e5d46]/80 hover:text-[#6e5d46] transition-colors"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#d4c8a9]/95 backdrop-blur-sm shadow-lg animate-fadeIn">
          <nav className="container mx-auto py-4 px-4 flex flex-col space-y-4">
            <Link to="/" className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-[#6e5d46]/10">
              <Home size={20} className="text-[#6e5d46]" />
              <span className="text-[#6e5d46]/80">Home</span>
            </Link>
            
            {user ? (
              <>
                <Link to="/book" className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-[#6e5d46]/10">
                  <Calendar size={20} className="text-[#6e5d46]" />
                  <span className="text-[#6e5d46]/80">Book Appointment</span>
                </Link>
                <Link to="/my-appointments" className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-[#6e5d46]/10">
                  <User size={20} className="text-[#6e5d46]" />
                  <span className="text-[#6e5d46]/80">My Appointments</span>
                </Link>
                
                {isAdmin && (
                  <Link to="/admin" className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-[#6e5d46]/10">
                    <Settings size={20} className="text-[#6e5d46]" />
                    <span className="text-[#6e5d46]/80">Admin Dashboard</span>
                  </Link>
                )}
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-[#6e5d46]/10 w-full text-left"
                >
                  <LogOut size={20} className="text-[#6e5d46]" />
                  <span className="text-[#6e5d46]/80">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-[#6e5d46]/10">
                  <User size={20} className="text-[#6e5d46]" />
                  <span className="text-[#6e5d46]/80">Login</span>
                </Link>
                <Link to="/register" className="py-3 px-4 rounded-lg bg-[#6e5d46] text-[#d4c8a9] text-center font-medium">
                  Register
                </Link>
              </>
            )}
            
            <a 
              href="https://www.instagram.com/medinanails.studio/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-[#6e5d46]/10"
            >
              <Instagram size={20} className="text-[#6e5d46]" />
              <span className="text-[#6e5d46]/80">Instagram</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;