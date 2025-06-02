
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  mobile_number: string;
  name: string;
  is_verified: boolean;
  visit_count: number;
  login_streak: number;
  last_login: string | null;
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
          // Update last login
          await supabase
            .from('users')
            .update({ 
              last_login: new Date().toISOString(),
              login_streak: (userData.login_streak || 0) + 1
            })
            .eq('id', userData.id);
          
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

  const registerUser = async (name: string, email: string, mobile: string) => {
    try {
      if (!mobile) {
        toast({
          title: "Mobile number required",
          description: "Please enter your mobile number to register."
        });
        return { success: false, error: "Mobile number required" };
      }

      const { data, error } = await supabase
        .from('users')
        .insert({
          name,
          email,
          mobile_number: mobile,
          is_verified: true, // Auto-verify for free access
          visit_count: 1
        })
        .select()
        .single();

      if (error) throw error;
      
      setUser(data);
      localStorage.setItem('user_email', data.email);
      
      toast({
        title: "Welcome!",
        description: "Registration successful! You now have access to the store."
      });
      
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
