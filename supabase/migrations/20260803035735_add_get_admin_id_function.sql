/*
# Add get_admin_id function

## Purpose
Returns the UUID of the admin user (k4hld@k4hld.com).
The frontend cannot query auth.users directly, so this SECURITY DEFINER function
provides the admin's user ID for chat conversation creation.

## Security
- SECURITY DEFINER: runs with elevated privileges to read auth.users
- Returns only the UUID, nothing sensitive
- Callable by any authenticated user
*/

CREATE OR REPLACE FUNCTION public.get_admin_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = 'k4hld@k4hld.com' LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_id() TO authenticated;
