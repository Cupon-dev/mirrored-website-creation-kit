
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductNotification {
  id: string;
  name: string;
  created_at: string;
}

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Check for unread notifications on component mount
    checkUnreadNotifications();

    // Set up real-time subscription for new products
    const channel = supabase
      .channel('product-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('New product added:', payload);
          handleNewProduct(payload.new as ProductNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkUnreadNotifications = async () => {
    try {
      const lastViewedDate = localStorage.getItem('updates_last_viewed');
      if (!lastViewedDate) return;

      const { data: newProducts, error } = await supabase
        .from('products')
        .select('id, name, created_at')
        .gt('created_at', lastViewedDate)
        .eq('is_active', true);

      if (error) {
        console.error('Error checking notifications:', error);
        return;
      }

      setUnreadCount(newProducts?.length || 0);
    } catch (error) {
      console.error('Error checking unread notifications:', error);
    }
  };

  const handleNewProduct = (newProduct: ProductNotification) => {
    // Increment unread count
    setUnreadCount(prev => prev + 1);

    // Show toast notification
    toast({
      title: "🎉 New Product Added!",
      description: `${newProduct.name} is now available in our store.`,
      duration: 5000,
    });
  };

  const markAsRead = () => {
    localStorage.setItem('updates_last_viewed', new Date().toISOString());
    setUnreadCount(0);
  };

  return {
    unreadCount,
    markAsRead,
    checkUnreadNotifications
  };
};
