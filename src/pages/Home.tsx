import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Heart, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  image_url: string | null;
}

const Home = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Medina Nails Studio | Home';

    const fetchServices = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;

        setServices(data || []);
      } catch (error) {
        console.error('Error fetching services:', error);
        setError('Failed to load services. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-light">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600">Loading services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center -mt-8 mb-8 py-12 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
          Book Your Perfect Manicure
        </h1>
        <p className="text-lg text-neutral-dark/70 max-w-2xl mb-8">
          Expert nail care at Medina Nails Studio. Treat yourself to a luxurious experience with our professional services.
        </p>
        {user ? (
          <Link to="/book">
            <Button size="lg" rightIcon={<Calendar size={16} />}>
              Book Appointment
            </Button>
          </Link>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/login">
              <Button variant="outline" size="lg">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg">
                Register to Book
              </Button>
            </Link>
          </div>
        )}
      </section>
      
      {/* Our Services Section */}
      <section className="py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-primary mb-2">Our Services</h2>
          <p className="text-neutral-dark/70">Experience perfection with our professional nail services</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div key={service.id} className="bg-neutral-light rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
              {service.image_url && (
                <img 
                  src={service.image_url} 
                  alt={service.name} 
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-primary mb-2">{service.name}</h3>
                {service.description && (
                  <p className="text-neutral-dark/70 mb-4">{service.description}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-primary font-semibold">${service.price}</span>
                  <Link to={user ? "/book" : "/login"}>
                    <Button variant="secondary" size="sm">
                      Book Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-10">
          <Link to={user ? "/book" : "/login"}>
            <Button variant="outline" size="lg">
              View All Services
            </Button>
          </Link>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-12 bg-[#6e5d46] rounded-2xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#f0f0f0] mb-2">How It Works</h2>
          <p className="text-[#f0f0f0]/90">Book your appointment in 3 simple steps</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center p-6">
            <div className="bg-[#d4c8a9] p-4 rounded-full shadow-md mb-4">
              <Calendar size={32} className="text-[#6e5d46]" />
            </div>
            <h3 className="text-xl font-semibold text-[#f0f0f0] mb-2">1. Select Services</h3>
            <p className="text-[#f0f0f0]/90">Choose from our wide range of professional nail services</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6">
            <div className="bg-[#d4c8a9] p-4 rounded-full shadow-md mb-4">
              <Clock size={32} className="text-[#6e5d46]" />
            </div>
            <h3 className="text-xl font-semibold text-[#f0f0f0] mb-2">2. Pick a Time</h3>
            <p className="text-[#f0f0f0]/90">Select an available date and time that works for you</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6">
            <div className="bg-[#d4c8a9] p-4 rounded-full shadow-md mb-4">
              <Sparkles size={32} className="text-[#6e5d46]" />
            </div>
            <h3 className="text-xl font-semibold text-[#f0f0f0] mb-2">3. Get Beautiful Nails</h3>
            <p className="text-[#f0f0f0]/90">Visit us at your scheduled time and enjoy your service</p>
          </div>
        </div>
        
        <div className="text-center mt-10">
          <Link to={user ? "/book" : "/register"}>
            <Button variant="secondary" size="lg">
              Book Your Appointment Now
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-primary mb-2">What Our Clients Say</h2>
          <p className="text-neutral-dark/70">Hear from our satisfied customers</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-neutral-light p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full mr-4" />
                <div>
                  <h4 className="font-semibold text-primary">{testimonial.name}</h4>
                  <div className="flex text-primary">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Heart key={i} fill={i < testimonial.rating ? 'currentColor' : 'none'} size={16} />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-neutral-dark/70 italic">"{testimonial.comment}"</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-primary rounded-2xl py-16 px-6 text-center">
        <h2 className="text-3xl font-bold text-neutral-light mb-4">Ready for Beautiful Nails?</h2>
        <p className="text-neutral-light/90 max-w-2xl mx-auto mb-8">
          Join our satisfied customers and experience the best nail care services at Medina Nails Studio.
        </p>
        <Link to={user ? "/book" : "/register"}>
          <Button variant="secondary" size="lg">
            Book Your Appointment
          </Button>
        </Link>
      </section>
    </div>
  );
};

const testimonials = [
  {
    id: 1,
    name: 'Sarah J.',
    rating: 5,
    comment: 'Absolutely love my nails! The staff is professional and the salon is beautiful. Will definitely be back!',
    avatar: 'https://randomuser.me/api/portraits/women/12.jpg'
  },
  {
    id: 2,
    name: 'Michael T.',
    rating: 5,
    comment: 'Booked for my wife and she came home thrilled. The booking process was super easy and the results were amazing.',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: 3,
    name: 'Jessica R.',
    rating: 4,
    comment: 'Great service and beautiful results. The booking app made scheduling so convenient.',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
  }
];

export default Home;