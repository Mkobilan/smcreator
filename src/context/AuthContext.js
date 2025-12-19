import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session?.user) {
          // Fetch additional profile info from public.profiles
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!profileError) {
            setUser({ ...session.user, ...profile });
          } else {
            console.error('Error fetching profile:', profileError);
            setUser(session.user);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser({ ...session.user, ...profile });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Register a new user
  const register = async (userData) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
          },
        },
      });

      if (error) throw error;

      // Note: user might need to confirm email depending on Supabase settings
      return data;
    } catch (error) {
      setError(error.message || 'Registration failed');
      throw error;
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      setError(error.message || 'Login failed');
      throw error;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setUser({ ...user, ...data });

      return data;
    } catch (error) {
      setError(error.message || 'Profile update failed');
      throw error;
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;
      return data;
    } catch (error) {
      setError(error.message || 'Password change failed');
      throw error;
    }
  };

  // Delete account
  const deleteAccount = async () => {
    try {
      setError(null);
      // In Supabase, deleting your own account is usually handled via an API route 
      // with service role or a custom Postgres function.
      const response = await fetch('/api/users/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Account deletion failed');
      }

      await logout();
      return { success: true };
    } catch (error) {
      setError(error.message || 'Account deletion failed');
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

