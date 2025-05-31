
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProducts = (categoryId?: string) => {
  return useQuery({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories (
            name,
            icon
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name,
            icon
          )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });
};
