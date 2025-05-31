
-- Create a function to handle user registration without RLS conflicts
CREATE OR REPLACE FUNCTION public.create_user_account(
  user_name TEXT,
  user_email TEXT,
  user_mobile TEXT DEFAULT NULL
)
RETURNS TABLE(id UUID, email TEXT, name TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.users (name, email, mobile_number, is_verified)
  VALUES (user_name, user_email, user_mobile, true)
  RETURNING users.id, users.email, users.name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_account TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_account TO authenticated;
