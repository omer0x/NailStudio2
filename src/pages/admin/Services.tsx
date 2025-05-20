import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import { PlusCircle, Edit, Trash, X } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  image_url: string | null;
  is_active: boolean;
}

const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentService, setCurrentService] = useState<Partial<Service> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    document.title = 'Manage Services | Medina Nails Studio';
    
    const fetchServices = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
        setError('Failed to load services. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServices();
  }, []);
  
  const handleAddService = () => {
    setCurrentService({
      name: '',
      description: '',
      price: 0,
      duration: 30,
      image_url: '',
      is_active: true,
    });
    setShowModal(true);
  };
  
  const handleEditService = (service: Service) => {
    setCurrentService(service);
    setShowModal(true);
  };
  
  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setServices(services.filter(service => service.id !== id));
    } catch (error) {
      console.error('Error deleting service:', error);
      setError('Failed to delete service. Please try again.');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentService) return;
    
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!currentService.name) {
        throw new Error('Name is required');
      }
      
      if (!currentService.price || currentService.price <= 0) {
        throw new Error('Price must be greater than 0');
      }
      
      if (!currentService.duration || currentService.duration <= 0) {
        throw new Error('Duration must be greater than 0');
      }
      
      const isEditing = Boolean(currentService.id);
      
      if (isEditing) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update({
            name: currentService.name,
            description: currentService.description || null,
            price: currentService.price,
            duration: currentService.duration,
            image_url: currentService.image_url || null,
            is_active: currentService.is_active,
          })
          .eq('id', currentService.id);
        
        if (error) throw error;
        
        // Update local state
        setServices(services.map(service => 
          service.id === currentService.id ? { ...service, ...currentService } as Service : service
        ));
      } else {
        // Create new service
        const { data, error } = await supabase
          .from('services')
          .insert({
            name: currentService.name,
            description: currentService.description || null,
            price: currentService.price,
            duration: currentService.duration,
            image_url: currentService.image_url || null,
            is_active: currentService.is_active,
          })
          .select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Add to local state
          setServices([...services, data[0] as Service]);
        }
      }
      
      // Close modal
      setShowModal(false);
      setCurrentService(null);
    } catch (error: any) {
      console.error('Error saving service:', error);
      setError(error.message || 'Failed to save service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (currentService) {
      setCurrentService({
        ...currentService,
        [name]: type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : name === 'price' || name === 'duration' 
            ? parseFloat(value) 
            : value,
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600">Loading services...</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Manage Services</h2>
        <Button 
          onClick={handleAddService}
          leftIcon={<PlusCircle size={16} />}
        >
          Add Service
        </Button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      {services.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">No services found.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={handleAddService}
          >
            Add Your First Service
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
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
                {services.map((service) => (
                  <tr key={service.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {service.image_url && (
                          <img
                            src={service.image_url}
                            alt={service.name}
                            className="h-10 w-10 rounded-full mr-3 object-cover"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {service.name}
                          </div>
                          {service.description && (
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${service.price}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{service.duration} min</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        service.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditService(service)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Add/Edit Service Modal */}
      {showModal && currentService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {currentService.id ? 'Edit Service' : 'Add New Service'}
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
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={currentService.name || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={currentService.description || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($)*
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={currentService.price || ''}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)*
                    </label>
                    <input
                      type="number"
                      id="duration"
                      name="duration"
                      value={currentService.duration || ''}
                      onChange={handleInputChange}
                      min="5"
                      step="5"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    id="image_url"
                    name="image_url"
                    value={currentService.image_url || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={currentService.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Active (available for booking)
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
                  {currentService.id ? 'Update Service' : 'Add Service'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices;