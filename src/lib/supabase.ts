import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Initialize Supabase client using environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please connect to Supabase using the "Connect to Supabase" button.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper functions for authentication
export async function signUp(email: string, password: string, fullName?: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (authError || !authData.user) {
    return { data: authData, error: authError };
  }

  // Create user profile after successful signup
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert([
      {
        id: authData.user.id,
        full_name: fullName || null,
        is_admin: false,
      }
    ]);

  if (profileError) {
    console.error('Error creating user profile:', profileError);
    // Sign out the user if profile creation fails
    await supabase.auth.signOut();
    return { 
      data: null, 
      error: new Error('Account created but profile setup failed. Please try again.') 
    };
  }

  return { data: authData, error: null };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Function to check if user is admin - using RPC to avoid policy recursion
export async function isUserAdmin(userId: string) {
  try {
    const { data, error } = await supabase
      .rpc('check_if_user_is_admin', {
        user_id: userId
      });
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return data ?? false;
  } catch (error) {
    console.error('Error in isUserAdmin:', error);
    return false;
  }
}