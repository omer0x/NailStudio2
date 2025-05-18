import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import { PlusCircle, Edit, Trash, X } from 'lucide-react';

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
  is_available: boolean;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AdminTimeSlots = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentTimeSlot, setCurrentTimeSlot] = useState<Partial<TimeSlot> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDay, setActiveDay] = useState<number>(1); // Monday by default
  
  useEffect(() => {
    document.title = 'Manage Time Slots | Medina Nails Studio';
    
    const fetchTimeSlots = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('time_slots')
          .select('*')
          .order('day_of_week')
          .order('start_time');
        
        if (error) throw error;
        
        setTimeSlots(data);
      } catch (error) {
        console.error('Error fetching time slots:', error);
        setError('Failed to load time slots. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTimeSlots();
  }, []);
  
  const handleAddTimeSlot = () => {
    setCurrentTimeSlot({
      start_time: '09:00',
      end_time: '09:30',
      day_of_week: activeDay,
      is_available: true,
    });
    setShowModal(true);
  };
  
  const handleEditTimeSlot = (timeSlot: TimeSlot) => {
    setCurrentTimeSlot(timeSlot);
    setShowModal(true);
  };
  
  const handleDeleteTimeSlot = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('time_slots')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setTimeSlots(timeSlots.filter(slot => slot.id !== id));
    } catch (error) {
      console.error('Error deleting time slot:', error);
      setError('Failed to delete time slot. Please try again.');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentTimeSlot) return;
    
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!currentTimeSlot.start_time) {
        throw new Error('Start time is required');
      }
      
      if (!currentTimeSlot.end_time) {
        throw new Error('End time is required');
      }
      
      if (currentTimeSlot.start_time >= currentTimeSlot.end_time) {
        throw new Error('End time must be after start time');
      }
      
      const isEditing = Boolean(currentTimeSlot.id);
      
      if (isEditing) {
        // Update existing time slot
        const { error } = await supabase
          .from('time_slots')
          .update({
            start_time: currentTimeSlot.start_time,
            end_time: currentTimeSlot.end_time,
            day_of_week: currentTimeSlot.day_of_week,
            is_available: currentTimeSlot.is_available,
          })
          .eq('id', currentTimeSlot.id);
        
        if (error) throw error;
        
        // Update local state
        setTimeSlots(timeSlots.map(slot => 
          slot.id === currentTimeSlot.id ? { ...slot, ...currentTimeSlot } as TimeSlot : slot
        ));
      } else {
        // Create new time slot
        const { data, error } = await supabase
          .from('time_slots')
          .insert({
            start_time: currentTimeSlot.start_time,
            end_time: currentTimeSlot.end_time,
            day_of_week: currentTimeSlot.day_of_week,
            is_available: currentTimeSlot.is_available,
          })
          .select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Add to local state
          setTimeSlots([...timeSlots, data[0] as TimeSlot]);
        }
      }
      
      // Close modal
      setShowModal(false);
      setCurrentTimeSlot(null);
    } catch (error: any) {
      console.error('Error saving time slot:', error);
      setError(error.message || 'Failed to save time slot. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (currentTimeSlot) {
      setCurrentTimeSlot({
        ...currentTimeSlot,
        [name]: type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : name === 'day_of_week' 
            ? parseInt(value, 10) 
            : value,
      });
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
  
  // Get time slots for the active day
  const filteredTimeSlots = timeSlots.filter(slot => slot.day_of_week === activeDay);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600">Loading time slots...</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Manage Time Slots</h2>
        <Button 
          onClick={handleAddTimeSlot}
          leftIcon={<PlusCircle size={16} />}
        >
          Add Time Slot
        </Button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      {/* Day of Week Tabs */}
      <div className="mb-6 bg-white rounded-lg shadow-sm overflow-x-auto">
        <div className="flex border-b">
          {dayNames.map((day, index) => (
            <button
              key={index}
              onClick={() => setActiveDay(index)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                activeDay === index
                  ? 'border-b-2 border-pink-500 text-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
      
      {filteredTimeSlots.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">No time slots found for {dayNames[activeDay]}.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={handleAddTimeSlot}
          >
            Add Time Slot for {dayNames[activeDay]}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredTimeSlots.map((slot) => (
            <div 
              key={slot.id}
              className={`bg-white rounded-lg shadow-sm p-4 border ${
                slot.is_available ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="text-lg font-medium">
                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditTimeSlot(slot)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteTimeSlot(slot.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
              <div className="flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  slot.is_available ? 'bg-green-500' : 'bg-gray-400'
                }`}></span>
                <span className="text-sm text-gray-600">
                  {slot.is_available ? 'Available' : 'Not Available'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Add/Edit Time Slot Modal */}
      {showModal && currentTimeSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {currentTimeSlot.id ? 'Edit Time Slot' : 'Add New Time Slot'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week*
                  </label>
                  <select
                    id="day_of_week"
                    name="day_of_week"
                    value={currentTimeSlot.day_of_week}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    required
                  >
                    {dayNames.map((day, index) => (
                      <option key={index} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time*
                    </label>
                    <input
                      type="time"
                      id="start_time"
                      name="start_time"
                      value={currentTimeSlot.start_time || ''}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                      End Time*
                    </label>
                    <input
                      type="time"
                      id="end_time"
                      name="end_time"
                      value={currentTimeSlot.end_time || ''}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_available"
                    name="is_available"
                    checked={currentTimeSlot.is_available}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_available" className="ml-2 block text-sm text-gray-700">
                    Available for booking
                  </label>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  isLoading={isSubmitting}
                >
                  {currentTimeSlot.id ? 'Update Time Slot' : 'Add Time Slot'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTimeSlots;