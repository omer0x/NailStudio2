import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isUserAdmin } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAdmin: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const clearAuthState = () => {
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    // Clear any stored tokens from localStorage
    localStorage.removeItem('sb-zlaebvykohjghpqltzop-auth-token');
    navigate('/login');
  };

  useEffect(() => {
    // Get the current session
    const getSession = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          clearAuthState();
          return;
        }

        setSession(data.session);
        setUser(data.session?.user || null);
        
        // Check if user is admin
        if (data.session?.user) {
          const adminStatus = await isUserAdmin(data.session.user.id);
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          clearAuthState();
          return;
        }

        if (event === 'TOKEN_REFRESHED' && !newSession) {
          clearAuthState();
          return;
        }

        setSession(newSession);
        setUser(newSession?.user || null);
        
        // Update admin status when auth state changes
        if (newSession?.user) {
          try {
            const adminStatus = await isUserAdmin(newSession.user.id);
            setIsAdmin(adminStatus);
          } catch (error) {
            console.error('Error checking admin status:', error);
            clearAuthState();
          }
        } else {
          setIsAdmin(false);
        }
        
        setIsLoading(false);
      }
    );

    // Cleanup subscription
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      clearAuthState();
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, clear the state
      clearAuthState();
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isAdmin,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};