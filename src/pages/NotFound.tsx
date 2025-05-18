import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Home } from 'lucide-react';

const NotFound = () => {
  useEffect(() => {
    document.title = 'Page Not Found | Medina Nails Studio';
  }, []);
  
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-6xl font-bold text-pink-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Page Not Found</h2>
      <p className="text-gray-600 max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button leftIcon={<Home size={16} />}>
          Back to Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;