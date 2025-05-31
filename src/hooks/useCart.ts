
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const getSessionId = () => {
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
};

export const useCart = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const sessionId = getSessionId();
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            name,
            price,
            image_url,
            razorpay_link
          )
        `)
        .eq('session_id', sessionId);
      
      if (error) throw error;
      return data;
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      const sessionId = getSessionId();
      
      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('session_id', sessionId)
        .eq('product_id', productId)
        .single();

      if (existingItem) {
        // Update quantity
        const { data, error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Insert new item
        const { data, error } = await supabase
          .from('cart_items')
          .insert([{ 
            session_id: sessionId, 
            product_id: productId, 
            quantity 
          }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({
        title: "Added to cart!",
        description: "Item has been added to your cart successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart.",
      });
    },
  });

  return {
    cart: cartQuery.data || [],
    isLoading: cartQuery.isLoading,
    addToCart: addToCartMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    cartTotal: cartQuery.data?.reduce((total, item) => total + (item.products?.price || 0) * item.quantity, 0) || 0,
    cartCount: cartQuery.data?.reduce((total, item) => total + item.quantity, 0) || 0,
  };
};
