import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, isAfter, isBefore, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Calendar, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  image_url: string | null;
}

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
  is_available: boolean;
}

interface BookingData {
  services: string[];
  date: string;
  timeSlotId: string;
  notes: string;
}

const BookAppointment = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookingData, setBookingData] = useState<BookingData>({
    services: [],
    date: format(new Date(), 'yyyy-MM-dd'),
    timeSlotId: '',
    notes: '',
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ id: string } | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check for user profile
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking user profile:', error);
          setUserProfile(null);
          return;
        }

        setUserProfile(data);
      } catch (error) {
        console.error('Error checking user profile:', error);
        setUserProfile(null);
      }
    };

    checkUserProfile();
  }, [user]);
  
  // Fetch services and time slots
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name');
        
        if (servicesError) throw servicesError;
        
        // Fetch time slots
        const { data: timeSlotsData, error: timeSlotsError } = await supabase
          .from('time_slots')
          .select('*')
          .eq('is_available', true)
          .order('start_time');
        
        if (timeSlotsError) throw timeSlotsError;
        
        setServices(servicesData || []);
        setTimeSlots(timeSlotsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load services and time slots. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    document.title = 'Book Appointment | Medina Nails Studio';
  }, []);
  
  // Calculate total price and duration when selected services change
  useEffect(() => {
    if (services.length > 0 && bookingData.services.length > 0) {
      const selectedServices = services.filter(service => 
        bookingData.services.includes(service.id)
      );
      
      const price = selectedServices.reduce((sum, service) => sum + service.price, 0);
      const duration = selectedServices.reduce((sum, service) => sum + service.duration, 0);
      
      setTotalPrice(price);
      setTotalDuration(duration);
    } else {
      setTotalPrice(0);
      setTotalDuration(0);
    }
  }, [bookingData.services, services]);
  
  // Fetch booked slots when date changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('time_slot_id')
          .eq('date', dateStr)
          .not('status', 'eq', 'cancelled');
        
        if (error) throw error;
        
        setBookedSlots(data.map(item => item.time_slot_id));
      } catch (error) {
        console.error('Error fetching booked slots:', error);
      }
    };
    
    if (step === 2) {
      fetchBookedSlots();
    }
  }, [selectedDate, step]);
  
  const handleSelectService = (serviceId: string) => {
    setBookingData(prev => {
      // If already selected, remove it, otherwise add it
      const updatedServices = prev.services.includes(serviceId)
        ? prev.services.filter(id => id !== serviceId)
        : [...prev.services, serviceId];
      
      return {
        ...prev,
        services: updatedServices,
      };
    });
  };
  
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setBookingData(prev => ({
      ...prev,
      date: format(date, 'yyyy-MM-dd'),
      // Reset time slot when date changes
      timeSlotId: '',
    }));
  };
  
  const handleSelectTimeSlot = (timeSlotId: string) => {
    setBookingData(prev => ({
      ...prev,
      timeSlotId,
    }));
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBookingData(prev => ({
      ...prev,
      notes: e.target.value,
    }));
  };
  
  const handleNextStep = () => {
    if (step === 1 && bookingData.services.length === 0) {
      setError('Please select at least one service');
      return;
    }
    
    if (step === 2 && !bookingData.timeSlotId) {
      setError('Please select a time slot');
      return;
    }
    
    setError(null);
    setStep(prev => prev + 1);
  };
  
  const handlePrevStep = () => {
    setError(null);
    setStep(prev => prev - 1);
  };
  
  const handleSubmitBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if user profile exists
    if (!userProfile) {
      setError('Please complete your profile before booking an appointment. Go to My Account to update your profile.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create the appointment
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .insert([
          {
            user_id: user.id,
            date: bookingData.date,
            time_slot_id: bookingData.timeSlotId,
            status: 'pending',
            notes: bookingData.notes || null,
          },
        ])
        .select()
        .single();
      
      if (appointmentError) throw appointmentError;
      
      // Add the services to the appointment
      const appointmentServices = bookingData.services.map(serviceId => ({
        appointment_id: appointmentData.id,
        service_id: serviceId,
      }));
      
      const { error: servicesError } = await supabase
        .from('appointment_services')
        .insert(appointmentServices);
      
      if (servicesError) throw servicesError;
      
      // Navigate to confirmation or my appointments
      navigate('/my-appointments', { 
        state: { 
          newBooking: true,
          appointmentId: appointmentData.id
        } 
      });
      
    } catch (error) {
      console.error('Error creating appointment:', error);
      setError(error instanceof Error ? error.message : 'Failed to book appointment. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  // Filter available time slots for the selected day
  const getAvailableTimeSlots = () => {
    const dayOfWeek = selectedDate.getDay();
    
    return timeSlots
      .filter(slot => slot.day_of_week === dayOfWeek)
      .filter(slot => !bookedSlots.includes(slot.id));
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600">Loading booking options...</p>
      </div>
    );
  }
  
  if (error && !step) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-700 mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }
  
  // Get day names for the date selection
  const getDayOptions = () => {
    const days = [];
    for (let i = 0; i < 14; i++) {
      const date = addDays(new Date(), i);
      days.push(date);
    }
    return days;
  };
  
  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  // Get selected services details
  const getSelectedServices = () => {
    return services.filter(service => bookingData.services.includes(service.id));
  };
  
  // Get selected time slot details
  const getSelectedTimeSlot = () => {
    return timeSlots.find(slot => slot.id === bookingData.timeSlotId);
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      {/* Booking Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <div className={`ml-2 text-sm font-medium ${
              step >= 1 ? 'text-gray-700' : 'text-gray-400'
            }`}>
              Services
            </div>
          </div>
          <div className={`flex-1 h-1 mx-2 ${
            step >= 2 ? 'bg-pink-600' : 'bg-gray-200'
          }`}></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            <div className={`ml-2 text-sm font-medium ${
              step >= 2 ? 'text-gray-700' : 'text-gray-400'
            }`}>
              Date & Time
            </div>
          </div>
          <div className={`flex-1 h-1 mx-2 ${
            step >= 3 ? 'bg-pink-600' : 'bg-gray-200'
          }`}></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              3
            </div>
            <div className={`ml-2 text-sm font-medium ${
              step >= 3 ? 'text-gray-700' : 'text-gray-400'
            }`}>
              Confirm
            </div>
          </div>
        </div>
      </div>
      
      {/* Booking Form */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Step 1: Select Services */}
        {step === 1 && (
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-[#6e5d46] mb-6">
              Select Your Services
            </h2>
            
            {error && (
              <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {services.map(service => (
                <div 
                  key={service.id}
                  onClick={() => handleSelectService(service.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    bookingData.services.includes(service.id) 
                      ? 'border-[#6e5d46] bg-[#d4c8a9]/20' 
                      : 'border-[#d4c8a9] hover:border-[#6e5d46]/50'
                  }`}
                >
                  <div className="flex items-start">
                    {service.image_url && (
                      <img 
                        src={service.image_url} 
                        alt={service.name} 
                        className="w-20 h-20 object-cover rounded-lg mr-4"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-[#6e5d46]">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-[#6e5d46]/70 mt-2">{service.description}</p>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-lg font-semibold text-[#6e5d46]">${service.price}</span>
                        <span className="text-sm text-[#6e5d46]/70">{service.duration} min</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {bookingData.services.length > 0 && (
              <div className="bg-[#d4c8a9]/10 p-6 rounded-lg mb-6 border border-[#6e5d46]/10">
                <h3 className="font-medium text-[#6e5d46] mb-3">Selected Services</h3>
                <ul className="space-y-2">
                  {getSelectedServices().map(service => (
                    <li key={service.id} className="flex justify-between">
                      <span className="text-[#6e5d46]/80">{service.name}</span>
                      <span className="font-medium text-[#6e5d46]">${service.price}</span>
                    </li>
                  ))}
                  <li className="flex justify-between pt-3 mt-2 border-t border-[#6e5d46]/10 font-semibold">
                    <span className="text-[#6e5d46]">Total</span>
                    <span className="text-lg text-[#6e5d46]">${totalPrice}</span>
                  </li>
                  <li className="flex justify-between text-sm text-[#6e5d46]/70 mt-1">
                    <span>Estimated Duration</span>
                    <span>{totalDuration} minutes</span>
                  </li>
                </ul>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button 
                onClick={handleNextStep}
                disabled={bookingData.services.length === 0}
                rightIcon={<ArrowRight size={16} />}
                className="px-8"
              >
                Select Date & Time
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 2: Select Date and Time */}
        {step === 2 && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Select Date & Time
            </h2>
            
            {error && (
              <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
                {error}
              </div>
            )}
            
            {/* Date Selection */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3">
                <Calendar size={16} className="inline mr-2" />
                Select a Date
              </h3>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {getDayOptions().map((date, index) => (
                  <button
                    key={index}
                    onClick={() => handleDateChange(date)}
                    className={`px-3 py-2 rounded-lg flex-shrink-0 flex flex-col items-center min-w-[80px] ${
                      format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                        ? 'bg-pink-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-pink-300'
                    }`}
                  >
                    <span className="text-xs font-medium">
                      {format(date, 'EEE')}
                    </span>
                    <span className="text-lg font-bold">
                      {format(date, 'd')}
                    </span>
                    <span className="text-xs">
                      {format(date, 'MMM')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Time Selection */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3">
                <Clock size={16} className="inline mr-2" />
                Select a Time
              </h3>
              
              {getAvailableTimeSlots().length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {getAvailableTimeSlots().map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => handleSelectTimeSlot(slot.id)}
                      className={`px-3 py-2 rounded-lg text-center ${
                        bookingData.timeSlotId === slot.id
                          ? 'bg-pink-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-pink-300'
                      }`}
                    >
                      {formatTime(slot.start_time)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No available time slots for this date.</p>
                  <p className="text-sm text-gray-400 mt-1">Please select another date.</p>
                </div>
              )}
            </div>
            
            {/* Special Requests */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3">
                Special Requests (Optional)
              </h3>
              <textarea
                value={bookingData.notes}
                onChange={handleNotesChange}
                className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:border-pink-500 focus:ring-pink-500"
                placeholder="Any specific preferences or requests..."
              ></textarea>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrevStep}
                leftIcon={<ChevronLeft size={16} />}
              >
                Back to Services
              </Button>
              <Button 
                onClick={handleNextStep}
                disabled={!bookingData.timeSlotId}
                rightIcon={<ArrowRight size={16} />}
              >
                Review & Confirm
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 3: Confirm Booking */}
        {step === 3 && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Confirm Your Appointment
            </h2>
            
            {error && (
              <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
                {error}
              </div>
            )}
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-gray-700 mb-3">Appointment Details</h3>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-200 pb-3">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-800">
                    {format(parseISO(bookingData.date), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-200 pb-3">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium text-gray-800">
                    {getSelectedTimeSlot() && formatTime(getSelectedTimeSlot()!.start_time)}
                  </span>
                </div>
                
                <div className="border-b border-gray-200 pb-3">
                  <span className="text-gray-600">Services:</span>
                  <ul className="mt-2 space-y-2">
                    {getSelectedServices().map(service => (
                      <li key={service.id} className="flex justify-between">
                        <span>{service.name}</span>
                        <span className="font-medium">${service.price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Amount:</span>
                  <span>${totalPrice}</span>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-center">
                  <p className="text-yellow-700">
                    Please pay in cash at the time of your appointment. 💅
                  </p>
                </div>
                
                {bookingData.notes && (
                  <div className="mt-4">
                    <span className="text-gray-600">Special Requests:</span>
                    <p className="mt-1 text-gray-800 bg-white p-3 rounded border border-gray-200">
                      {bookingData.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrevStep}
                leftIcon={<ChevronLeft size={16} />}
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmitBooking}
                isLoading={isSubmitting}
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;