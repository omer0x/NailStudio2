import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import { CheckCircle, XCircle, Eye, Filter } from 'lucide-react';

interface Appointment {
  id: string;
  date: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string | null;
  created_at: string;
  user_profiles: {
    full_name: string | null;
    email: string;
  };
  time_slot: {
    start_time: string;
  };
  services: {
    service: {
      name: string;
      price: number;
    }
  }[];
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    document.title = 'Manage Appointments | Medina Nails Studio';
    
    const fetchAppointments = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No active session');

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-appointments`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch appointments');
        }
        
        const data = await response.json();
        
        setAppointments(data as Appointment[]);
        setFilteredAppointments(data as Appointment[]);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Failed to load appointments. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAppointments();
  }, []);
  
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(
        appointments.filter(appointment => appointment.status === activeFilter)
      );
    }
  }, [activeFilter, appointments]);
  
  const handleUpdateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setAppointments(prevAppointments =>
        prevAppointments.map(appointment =>
          appointment.id === id ? { ...appointment, status } : appointment
        )
      );
      
      // Close modal if open
      if (showModal && selectedAppointment?.id === id) {
        setSelectedAppointment({
          ...selectedAppointment,
          status,
        });
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Failed to update appointment status. Please try again.');
    }
  };
  
  const viewAppointmentDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };
  
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  const calculateTotal = (services: { service: { price: number } }[]) => {
    return services.reduce((sum, item) => sum + item.service.price, 0);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600">Loading appointments...</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 sm:mb-0">Manage Appointments</h2>
        
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as any)}
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">No appointments found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.user_profiles?.full_name || 'No name provided'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {appointment.user_profiles?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(parseISO(appointment.date), 'MMM d, yyyy')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(appointment.time_slot.start_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {appointment.services.slice(0, 2).map((item, i) => (
                          <span key={i} className="block">
                            {item.service.name}
                          </span>
                        ))}
                        {appointment.services.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{appointment.services.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[appointment.status]}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => viewAppointmentDetails(appointment)}
                          className="text-gray-600 hover:text-gray-900"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        
                        {appointment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(appointment.id, 'confirmed')}
                              className="text-green-600 hover:text-green-900"
                              title="Confirm"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}
                              className="text-red-600 hover:text-red-900"
                              title="Cancel"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Appointment Details Modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Appointment Details
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircle size={20} />
                </button>
              </div>
              
              <div className="mb-4">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[selectedAppointment.status]}`}>
                  {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Customer</h4>
                  <p className="text-gray-900">{selectedAppointment.user_profiles?.full_name || 'No name provided'}</p>
                  <p className="text-sm text-gray-500">{selectedAppointment.user_profiles?.email}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Date & Time</h4>
                  <p className="text-gray-900">
                    {format(parseISO(selectedAppointment.date), 'EEEE, MMMM d, yyyy')} at {formatTime(selectedAppointment.time_slot.start_time)}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Services</h4>
                  <ul className="mt-1 space-y-1">
                    {selectedAppointment.services.map((item, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="text-gray-900">{item.service.name}</span>
                        <span className="text-gray-900">{item.service.price} mkd</span>
                      </li>
                    ))}
                    <li className="flex justify-between border-t border-gray-200 pt-2 mt-2 font-medium">
                      <span>Total</span>
                      <span>{calculateTotal(selectedAppointment.services)} mkd</span>
                    </li>
                  </ul>
                </div>
                
                {selectedAppointment.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded mt-1">{selectedAppointment.notes}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Booking Information</h4>
                  <p className="text-gray-900">
                    Created on {format(parseISO(selectedAppointment.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setShowModal(false)}
                >
                  Close
                </Button>
                
                {selectedAppointment.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button 
                      variant="danger"
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'cancelled')}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'confirmed')}
                    >
                      Confirm
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;