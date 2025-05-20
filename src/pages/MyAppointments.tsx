import { useEffect, useState } from 'react';
import { format, parseISO, isPast } from 'date-fns';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Calendar, Clock, XCircle, CheckCircle } from 'lucide-react';

interface Appointment {
  id: string;
  date: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string | null;
  created_at: string;
  time_slot: {
    start_time: string;
    end_time: string;
  };
  services: {
    id: string;
    name: string;
    price: number;
  }[];
}

const statusLabels = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
};

const MyAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const location = useLocation();
  
  // Check if this is coming from a new booking
  const newBooking = location.state?.newBooking || false;
  const newAppointmentId = location.state?.appointmentId;
  
  useEffect(() => {
    document.title = 'My Appointments | Medina Nails Studio';
    
    const fetchAppointments = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            date,
            status,
            notes,
            created_at,
            time_slot:time_slots(start_time, end_time),
            services:appointment_services(
              service:services(id, name, price)
            )
          `)
          .eq('user_id', user.id)
          .order('date', { ascending: true });
        
        if (error) throw error;
        
        // Format the appointments data
        const formattedAppointments = data.map(appointment => ({
          id: appointment.id,
          date: appointment.date,
          status: appointment.status,
          notes: appointment.notes,
          created_at: appointment.created_at,
          time_slot: appointment.time_slot,
          services: appointment.services.map((s: any) => s.service)
        }));
        
        setAppointments(formattedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Failed to load your appointments. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAppointments();
  }, [user]);
  
  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);
      
      if (error) throw error;
      
      // Update the local state
      setAppointments(prevAppointments => 
        prevAppointments.map(appointment => 
          appointment.id === appointmentId
            ? { ...appointment, status: 'cancelled' }
            : appointment
        )
      );
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setError('Failed to cancel the appointment. Please try again.');
    }
  };
  
  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  // Calculate total price for an appointment
  const calculateTotal = (services: { price: number }[]) => {
    return services.reduce((sum, service) => sum + service.price, 0);
  };
  
  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter(appointment => {
    const isInPast = isPast(parseISO(appointment.date));
    return activeTab === 'past' ? isInPast : !isInPast;
  });
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600">Loading your appointments...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Appointments</h1>
      
      {newBooking && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 animate-fadeIn">
          <h2 className="font-semibold flex items-center mb-2">
            <CheckCircle className="inline-block mr-2" size={18} />
            Appointment Booked Successfully!
          </h2>
          <p>Your appointment has been successfully booked and is now pending confirmation.</p>
          <p className="mt-1 text-sm text-green-600">Please remember to pay in cash when you arrive.</p>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 px-1 ${
              activeTab === 'upcoming'
                ? 'border-b-2 border-pink-500 text-pink-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`pb-3 px-1 ${
              activeTab === 'past'
                ? 'border-b-2 border-pink-500 text-pink-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Past
          </button>
        </div>
      </div>
      
      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">
            {activeTab === 'upcoming'
              ? 'You have no upcoming appointments.'
              : 'You have no past appointments.'}
          </p>
          {activeTab === 'upcoming' && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.href = '/book'}
            >
              Book Now
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAppointments.map(appointment => (
            <div 
              key={appointment.id} 
              className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                newAppointmentId === appointment.id ? 'ring-2 ring-pink-500' : ''
              }`}
            >
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                  <div className="mb-2 sm:mb-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusLabels[appointment.status].color}`}>
                      {statusLabels[appointment.status].label}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Booked on {format(parseISO(appointment.created_at), 'MMM d, yyyy')}
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3">
                    <div className="flex items-start mb-3">
                      <Calendar size={18} className="text-gray-400 mt-1 mr-2" />
                      <div>
                        <div className="text-sm text-gray-500">Date</div>
                        <div className="font-medium">
                          {format(parseISO(appointment.date), 'EEEE, MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Clock size={18} className="text-gray-400 mt-1 mr-2" />
                      <div>
                        <div className="text-sm text-gray-500">Time</div>
                        <div className="font-medium">
                          {formatTime(appointment.time_slot.start_time)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:w-2/3">
                    <h3 className="font-medium text-gray-700 mb-2">Services</h3>
                    <ul className="space-y-2 mb-4">
                      {appointment.services.map(service => (
                        <li key={service.id} className="flex justify-between text-sm">
                          <span>{service.name}</span>
                         <span>{service.price} mkd</span>
                        </li>
                      ))}
                      
                      <li className="flex justify-between pt-2 border-t border-gray-200 font-medium">
                        <span>Total</span>
                       <span>{calculateTotal(appointment.services)} mkd</span>
                      </li>
                    </ul>
                    
                    {appointment.notes && (
                      <div className="mt-4 text-sm">
                        <h3 className="font-medium text-gray-700 mb-1">Special Requests</h3>
                        <p className="text-gray-600">{appointment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action buttons */}
                {activeTab === 'upcoming' && appointment.status !== 'cancelled' && (
                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      leftIcon={<XCircle size={16} />}
                      onClick={() => window.confirm('Are you sure you want to cancel this appointment?') && 
                        cancelAppointment(appointment.id)}
                    >
                      Cancel Appointment
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAppointments;