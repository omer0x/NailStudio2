import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Calendar, Users, Scissors, Clock, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalAppointments: number;
  pendingAppointments: number;
  totalServices: number;
  totalUsers: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    pendingAppointments: 0,
    totalServices: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  
  useEffect(() => {
    document.title = 'Admin Dashboard | Medina Nails Studio';
    
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch appointments count
        const { count: totalAppointments, error: apptError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true });
        
        if (apptError) throw apptError;
        
        // Fetch pending appointments count
        const { count: pendingAppointments, error: pendingError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        if (pendingError) throw pendingError;
        
        // Fetch services count
        const { count: totalServices, error: servicesError } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true });
        
        if (servicesError) throw servicesError;
        
        // Fetch users count
        const { count: totalUsers, error: usersError } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });
        
        if (usersError) throw usersError;
        
        // Fetch recent appointments
        const { data: recentAppts, error: recentError } = await supabase
          .from('appointments')
          .select(`
            id,
            date,
            status,
            created_at,
            user_profiles(full_name),
            time_slots(start_time),
            services:appointment_services(services(name))
          `)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (recentError) throw recentError;
        
        setStats({
          totalAppointments: totalAppointments || 0,
          pendingAppointments: pendingAppointments || 0,
          totalServices: totalServices || 0,
          totalUsers: totalUsers || 0,
        });
        
        setRecentAppointments(recentAppts || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600">Loading dashboard data...</p>
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
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Dashboard Overview</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Total Appointments</h3>
            <Calendar className="text-pink-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.totalAppointments}</p>
          <p className="text-sm text-gray-500 mt-2">All time bookings</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Pending Appointments</h3>
            <Clock className="text-yellow-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.pendingAppointments}</p>
          <p className="text-sm text-gray-500 mt-2">Awaiting confirmation</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Active Services</h3>
            <Scissors className="text-blue-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.totalServices}</p>
          <p className="text-sm text-gray-500 mt-2">Available services</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Registered Users</h3>
            <Users className="text-green-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.totalUsers}</p>
          <p className="text-sm text-gray-500 mt-2">Total customers</p>
        </div>
      </div>
      
      {/* Recent Appointments */}
      <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
        <TrendingUp size={20} className="mr-2 text-pink-500" />
        Recent Bookings
      </h3>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentAppointments.length > 0 ? (
                recentAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.user_profiles?.full_name || 'Anonymous'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(appointment.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.time_slots?.start_time ? 
                          new Date(`2000-01-01T${appointment.time_slots.start_time}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          }) : 'N/A'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {appointment.services.map((s: any) => s.services.name).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        appointment.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : appointment.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No recent appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;