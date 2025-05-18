import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Search, User } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
  email: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    document.title = 'Manage Users | Medina Nails Studio';
    
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No active session');

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-users`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch users');
        }

        const users = await response.json();
        setUsers(users);
        setFilteredUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // Filter users when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = users.filter(
      user => 
        (user.full_name?.toLowerCase().includes(lowerSearchTerm) || false) ||
        (user.email.toLowerCase().includes(lowerSearchTerm)) ||
        (user.phone?.toLowerCase().includes(lowerSearchTerm) || false)
    );
    
    setFilteredUsers(filtered);
  }, [searchTerm, users]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600">Loading users...</p>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Registered Users</h2>
      
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search users by name, email, or phone"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
          />
        </div>
      </div>
      
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">
            {searchTerm ? 'No users match your search.' : 'No users found.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User size={20} className="text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'No name provided'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.phone || 'Not provided'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.is_admin ? 'Admin' : 'Customer'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;