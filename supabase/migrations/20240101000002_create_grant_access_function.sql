
-- Create a function to grant user access with proper permissions
CREATE OR REPLACE FUNCTION public.grant_user_access(
  p_user_id UUID,
  p_product_id UUID,
  p_payment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert user product access record
  INSERT INTO public.user_product_access (user_id, product_id, payment_id)
  VALUES (p_user_id, p_product_id, p_payment_id)
  ON CONFLICT (user_id, product_id) DO NOTHING;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.grant_user_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_user_access TO service_role;
