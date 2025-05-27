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
    // Calculate total duration of selected services
    const totalDuration = getSelectedServices().reduce((sum, service) => sum + service.duration, 0);
    
    // Calculate how many 30-minute slots we need
    const requiredSlots = Math.ceil(totalDuration / 30);
    
    // Get the selected time slot
    const selectedSlot = timeSlots.find(slot => slot.id === timeSlotId);
    if (!selectedSlot) return;
    
    // Get all slots for the selected day
    const daySlots = timeSlots.filter(slot => slot.day_of_week === selectedSlot.day_of_week);
    
    // Find the index of the selected slot
    const selectedIndex = daySlots.findIndex(slot => slot.id === timeSlotId);
    
    // Check if we have enough consecutive slots available
    const hasEnoughSlots = Array.from({ length: requiredSlots }).every((_, i) => {
      const slot = daySlots[selectedIndex + i];
      return slot && !bookedSlots.includes(slot.id);
    });
    
    if (!hasEnoughSlots) {
      setError(`This service requires ${requiredSlots * 30} minutes. Please select a time slot with enough available time.`);
      return;
    }
    
    setError(null);
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

    // Don't show slots for today or past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateStart = new Date(selectedDate);
    selectedDateStart.setHours(0, 0, 0, 0);

    if (selectedDateStart <= today) {
      return [];
    }

    // Calculate total duration for selected services
    const totalDuration = getSelectedServices().reduce((sum, service) => sum + service.duration, 0);
    const requiredSlots = Math.ceil(totalDuration / 30);

    // Get all slots for the day
    const daySlots = timeSlots
      .filter(slot => slot.day_of_week === dayOfWeek)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    // Filter slots that have enough consecutive availability
    return daySlots.filter((slot, index) => {
      // Check if we have enough consecutive slots after this one
      const hasEnoughSlots = Array.from({ length: requiredSlots }).every((_, i) => {
        const nextSlot = daySlots[index + i];
        return nextSlot && !bookedSlots.includes(nextSlot.id);
      });

      // Check if all required slots are consecutive
      if (hasEnoughSlots && requiredSlots > 1) {
        const startTime = daySlots[index].start_time;
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMinute;

        // Check if all subsequent slots are consecutive
        return Array.from({ length: requiredSlots - 1 }).every((_, i) => {
          const nextSlot = daySlots[index + i + 1];
          if (!nextSlot) return false;

          const [nextHour, nextMinute] = nextSlot.start_time.split(':').map(Number);
          const nextMinutes = nextHour * 60 + nextMinute;

          return nextMinutes === startMinutes + ((i + 1) * 30);
        });
      }

      return hasEnoughSlots;
    });
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
    // Start from tomorrow (i=1) and go up to 60 days ahead
    for (let i = 1; i < 61; i++) {
      const date = addDays(new Date(), i);
      // Skip Sundays
      if (date.getDay() !== 0) {
        days.push(date);
      }
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
    <div className="max-w-4xl mx-auto">
      {/* Booking Steps */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-[#6e5d46] text-[#f0f0f0]' : 'bg-[#d4c8a9]/50 text-[#6e5d46]/50'
            }`}>
              1
            </div>
            <div className={`ml-2 text-sm font-medium ${
              step >= 1 ? 'text-[#6e5d46]' : 'text-[#6e5d46]/50'
            }`}>
              Services
            </div>
          </div>
          <div className={`flex-1 h-1 mx-2 ${
            step >= 2 ? 'bg-[#6e5d46]' : 'bg-[#d4c8a9]/50'
          }`}></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-[#6e5d46] text-[#f0f0f0]' : 'bg-[#d4c8a9]/50 text-[#6e5d46]/50'
            }`}>
              2
            </div>
            <div className={`ml-2 text-sm font-medium ${
              step >= 2 ? 'text-[#6e5d46]' : 'text-[#6e5d46]/50'
            }`}>
              Date & Time
            </div>
          </div>
          <div className={`flex-1 h-1 mx-2 ${
            step >= 3 ? 'bg-[#6e5d46]' : 'bg-[#d4c8a9]/50'
          }`}></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-[#6e5d46] text-[#f0f0f0]' : 'bg-[#d4c8a9]/50 text-[#6e5d46]/50'
            }`}>
              3
            </div>
            <div className={`ml-2 text-sm font-medium ${
              step >= 3 ? 'text-[#6e5d46]' : 'text-[#6e5d46]/50'
            }`}>
              Confirm
            </div>
          </div>
        </div>
      </div>
      
      {/* Booking Form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-[#6e5d46]/10">
        {/* Step 1: Select Services */}
        {step === 1 && (
          <div className="p-6">
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
                      : 'border-[#6e5d46]/10 hover:border-[#6e5d46]/30 hover:bg-[#d4c8a9]/10'
                  }`}
                >
                  <div className="flex items-start">
                    {service.image_url && (
                      <img 
                        src={service.image_url} 
                        alt={service.name} 
                        className="w-20 h-20 object-cover rounded-lg mr-4 shadow-sm"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-[#6e5d46] text-lg">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-[#6e5d46]/70 mt-2">{service.description}</p>
                      )}
                      <div className="flex justify-between items-center mt-2">
                       <span className="text-[#6e5d46] font-semibold text-lg">{service.price} mkd</span>
                        <span className="text-sm text-[#6e5d46]/70">{service.duration} min</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {bookingData.services.length > 0 && (
              <div className="bg-[#d4c8a9]/20 p-6 rounded-lg mb-6">
                <h3 className="font-medium text-[#6e5d46] mb-4">Selected Services</h3>
                <ul className="space-y-2">
                  {getSelectedServices().map(service => (
                    <li key={service.id} className="flex justify-between">
                      <span className="text-[#6e5d46]/80">{service.name}</span>
                      <span className="font-medium text-[#6e5d46]">{service.price} mkd</span>
                    </li>
                  ))}
                  <li className="flex justify-between pt-4 mt-2 border-t border-[#6e5d46]/10 font-semibold">
                    <span className="text-[#6e5d46]">Total</span>
                    <span className="text-[#6e5d46]">{totalPrice} mkd</span>
                  </li>
                  <li className="flex justify-between text-sm text-[#6e5d46]/70">
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
            <h2 className="text-2xl font-semibold text-[#6e5d46] mb-6">
              Select Date & Time
            </h2>
            
            {error && (
              <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
                {error}
              </div>
            )}
            
            {/* Date Selection */}
            <div className="mb-6">
              <h3 className="font-medium text-[#6e5d46] mb-4 flex items-center">
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
                        ? 'bg-[#6e5d46] text-[#f0f0f0]'
                        : 'bg-white/80 border border-[#6e5d46]/20 text-[#6e5d46] hover:border-[#6e5d46]/50 hover:bg-[#d4c8a9]/10'
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
              <h3 className="font-medium text-[#6e5d46] mb-4 flex items-center">
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
                          ? 'bg-[#6e5d46] text-[#f0f0f0]'
                          : 'bg-white/80 border border-[#6e5d46]/20 text-[#6e5d46] hover:border-[#6e5d46]/50 hover:bg-[#d4c8a9]/10'
                      }`}
                    >
                      {formatTime(slot.start_time)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-[#d4c8a9]/10 rounded-lg border border-[#6e5d46]/10">
                  <p className="text-[#6e5d46]/80">No available time slots for this date.</p>
                  <p className="text-sm text-[#6e5d46]/60 mt-2">Please select another date.</p>
                </div>
              )}
            </div>
            
            {/* Special Requests */}
            <div className="mb-6">
              <h3 className="font-medium text-[#6e5d46] mb-3">
                Special Requests (Optional)
              </h3>
              <textarea
                value={bookingData.notes}
                onChange={handleNotesChange}
                className="w-full border border-[#6e5d46]/20 rounded-lg p-4 h-32 focus:border-[#6e5d46] focus:ring-[#6e5d46]/30 bg-white/80"
                placeholder="Any specific preferences or requests..."
              ></textarea>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrevStep}
                leftIcon={<ChevronLeft size={16} />}
                className="px-6"
              >
                Back
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
            <h2 className="text-2xl font-semibold text-[#6e5d46] mb-6">
              Confirm Your Appointment
            </h2>
            
            {error && (
              <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
                {error}
              </div>
            )}
            
            <div className="bg-[#d4c8a9]/20 p-6 rounded-lg mb-6">
              <h3 className="font-medium text-[#6e5d46] mb-4">Appointment Details</h3>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-[#6e5d46]/10 pb-4">
                  <span className="text-[#6e5d46]/70">Date:</span>
                  <span className="font-medium text-[#6e5d46]">
                    {format(parseISO(bookingData.date), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-[#6e5d46]/10 pb-4">
                  <span className="text-[#6e5d46]/70">Time:</span>
                  <span className="font-medium text-[#6e5d46]">
                    {getSelectedTimeSlot() && formatTime(getSelectedTimeSlot()!.start_time)}
                  </span>
                </div>
                
                <div className="border-b border-[#6e5d46]/10 pb-4">
                  <span className="text-[#6e5d46]/70">Services:</span>
                  <ul className="mt-2 space-y-2">
                    {getSelectedServices().map(service => (
                      <li key={service.id} className="flex justify-between">
                        <span className="text-[#6e5d46]">{service.name}</span>
                        <span className="font-medium text-[#6e5d46]">{service.price} mkd</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex justify-between font-semibold text-xl text-[#6e5d46]">
                  <span>Total:</span>
                  <span className="text-[#6e5d46]">{totalPrice} mkd</span>
                </div>
                
                <div className="bg-[#d4c8a9]/30 p-4 rounded-lg border border-[#6e5d46]/20 text-center">
                  <p className="text-[#6e5d46]">
                    Please pay in cash at the time of your appointment. 💅
                  </p>
                </div>
                
                {bookingData.notes && (
                  <div className="mt-4">
                    <span className="text-[#6e5d46]/70">Special Requests:</span>
                    <p className="mt-2 text-[#6e5d46] bg-white/80 p-4 rounded-lg border border-[#6e5d46]/20">
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
                className="px-6"
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmitBooking}
                isLoading={isSubmitting}
                className="px-8"
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