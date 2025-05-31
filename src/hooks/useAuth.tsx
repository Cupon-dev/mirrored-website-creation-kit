
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  mobile_number?: string;
  name: string;
  is_verified: boolean;
  visit_count: number;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const userEmail = localStorage.getItem('user_email');
      if (userEmail) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', userEmail)
          .single();

        if (userData && !error) {
          setUser(userData);
          // Track session
          await supabase.from('user_sessions').insert({
            user_id: userData.id,
            ip_address: await getClientIP(),
            user_agent: navigator.userAgent
          });
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (name: string, email: string, mobile?: string) => {
    try {
      // First disable RLS temporarily for this operation
      const { data, error } = await supabase.rpc('create_user_account', {
        user_name: name,
        user_email: email,
        user_mobile: mobile
      });

      if (error) {
        // Fallback to direct insert if RPC doesn't exist
        const { data: userData, error: insertError } = await supabase
          .from('users')
          .insert({
            name,
            email,
            mobile_number: mobile,
            is_verified: true // Auto-verify since no payment required
          })
          .select()
          .single();

        if (insertError) throw insertError;
        
        setUser(userData);
        localStorage.setItem('user_email', userData.email);
        
        toast({
          title: "Welcome!",
          description: "Registration successful! You now have access to the store."
        });
        
        return { success: true, userId: userData.id };
      }
      
      return { success: true, userId: data.id };
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register user"
      });
      return { success: false, error };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user_email');
  };

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  return {
    user,
    isLoading,
    registerUser,
    logout,
    isVerified: user?.is_verified || false
  };
};
