
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
      const { data, error } = await supabase
        .from('users')
        .insert({
          name,
          email,
          mobile_number: mobile,
          is_verified: false
        })
        .select()
        .single();

      if (error) throw error;
      
      localStorage.setItem('pending_user_id', data.id);
      toast({
        title: "Registration initiated",
        description: "Please complete payment to verify your account."
      });
      
      return { success: true, userId: data.id };
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register user"
      });
      return { success: false, error };
    }
  };

  const verifyPayment = async (paymentId: string) => {
    try {
      const pendingUserId = localStorage.getItem('pending_user_id');
      if (!pendingUserId) throw new Error('No pending registration found');

      const { data, error } = await supabase
        .from('users')
        .update({
          is_verified: true,
          razorpay_payment_id: paymentId
        })
        .eq('id', pendingUserId)
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      localStorage.setItem('user_email', data.email);
      localStorage.removeItem('pending_user_id');
      
      toast({
        title: "Welcome!",
        description: "Your account has been verified successfully."
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message
      });
      return { success: false, error };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user_email');
    localStorage.removeItem('pending_user_id');
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
    verifyPayment,
    logout,
    isVerified: user?.is_verified || false
  };
};
