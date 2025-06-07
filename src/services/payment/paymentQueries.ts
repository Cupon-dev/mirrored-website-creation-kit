
import { supabase } from '@/integrations/supabase/client';

export const getPaymentsByEmail = async (email: string) => {
  const { data: payments, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false });

  return { payments, error: paymentError };
};

export const getActiveProducts = async () => {
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('id')
    .eq('is_active', true)
    .limit(1);

  return { productsData, error: productsError };
};

export const checkExistingAccess = async (userId: string, productId: string) => {
  const { data: existingAccess, error: accessCheckError } = await supabase
    .from('user_product_access')
    .select('id, created_at')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  return { existingAccess, error: accessCheckError };
};

export const grantUserAccess = async (userId: string, productId: string, paymentId: string) => {
  const { error: accessError } = await supabase
    .from('user_product_access')
    .insert({
      user_id: userId,
      product_id: productId,
      payment_id: paymentId
    });

  return { error: accessError };
};

export const updatePaymentStatus = async (paymentId: string, status: string) => {
  const { error: updateError } = await supabase
    .from('payments')
    .update({ 
      status: status,
      verified_at: new Date().toISOString()
    })
    .eq('id', paymentId);

  return { error: updateError };
};

export const createPaymentRecord = async (
  email: string, 
  phoneNumber: string, 
  amount: number, 
  razorpayOrderId: string
) => {
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert([{
      email: email,
      mobile_number: phoneNumber,
      amount: amount,
      google_drive_link: "https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view?usp=share_link",
      razorpay_order_id: razorpayOrderId,
      status: 'pending'
    }])
    .select()
    .single();

  return { payment, error: paymentError };
};

export const findStuckPayments = async (email: string) => {
  const { data: stuckPayments, error } = await supabase
    .from('payments')
    .select('*')
    .eq('email', email)
    .eq('status', 'pending')
    .not('razorpay_payment_id', 'is', null);

  return { stuckPayments, error };
};

export const fixStuckPaymentsByEmail = async (email: string) => {
  const { error: updateError } = await supabase
    .from('payments')
    .update({ 
      status: 'completed',
      verified_at: new Date().toISOString()
    })
    .eq('email', email)
    .eq('status', 'pending')
    .not('razorpay_payment_id', 'is', null);

  return { error: updateError };
};
