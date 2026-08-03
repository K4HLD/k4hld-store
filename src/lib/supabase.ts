import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const ADMIN_EMAIL = 'k4hld@k4hld.com';

export function isAdmin(email: string | undefined | null): boolean {
  return email === ADMIN_EMAIL;
}

export type Product = {
  id: string;
  title: string;
  price: number;
  image_url: string;
  description: string | null;
  created_at: string;
};

export type Conversation = {
  id: string;
  user_id: string;
  admin_id: string;
  product_id: string | null;
  product_title: string;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};
