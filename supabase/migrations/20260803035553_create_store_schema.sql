/*
# K4HLD STORE - Database Schema

## Overview
Creates the full schema for a gaming accounts store (Free Fire / eFootball).
The app requires sign-in to view products. One admin user manages products.
Users chat with admin in real-time to purchase accounts.

## Tables

### products
- `id` (uuid, PK)
- `title` (text) - account title, e.g. "حساب Free Fire VIP"
- `price` (numeric) - price in Moroccan Dirham (MAD)
- `image_url` (text) - product image URL
- `description` (text, nullable) - optional details
- `created_at` (timestamptz)

### chat_conversations
- `id` (uuid, PK)
- `user_id` (uuid, FK auth.users) - the buyer
- `admin_id` (uuid, FK auth.users) - the admin (k4hld@k4hld.com)
- `product_id` (uuid, FK products, nullable) - product being discussed
- `product_title` (text) - snapshot of product title at chat creation
- `created_at` (timestamptz)

### chat_messages
- `id` (uuid, PK)
- `conversation_id` (uuid, FK chat_conversations)
- `sender_id` (uuid, FK auth.users) - who sent the message
- `content` (text) - message text
- `created_at` (timestamptz)

## Security (RLS)

### products
- SELECT: any authenticated user can view products (store is visible after login)
- INSERT/UPDATE/DELETE: only the admin (k4hld@k4hld.com) by email check

### chat_conversations
- SELECT: participants only (user or admin of the conversation)
- INSERT: authenticated users can create their own conversations (user_id = auth.uid())
- UPDATE/DELETE: admin only

### chat_messages
- SELECT: participants of the parent conversation only
- INSERT: participants of the parent conversation only
- UPDATE/DELETE: admin only

## Notes
1. Admin is identified by email 'k4hld@k4hld.com' in policies.
2. All tables have RLS enabled.
3. Owner columns default to auth.uid() where applicable.
*/

-- ============ PRODUCTS ============
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  price numeric(10,2) NOT NULL,
  image_url text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can view products
DROP POLICY IF EXISTS "authenticated_select_products" ON products;
CREATE POLICY "authenticated_select_products" ON products FOR SELECT
  TO authenticated USING (true);

-- Only admin can insert/update/delete products
DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (auth.email() = 'k4hld@k4hld.com');

DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products" ON products FOR UPDATE
  TO authenticated USING (auth.email() = 'k4hld@k4hld.com')
  WITH CHECK (auth.email() = 'k4hld@k4hld.com');

DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products" ON products FOR DELETE
  TO authenticated USING (auth.email() = 'k4hld@k4hld.com');

-- ============ CHAT CONVERSATIONS ============
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- Participants can view their conversations
DROP POLICY IF EXISTS "participants_select_conversations" ON chat_conversations;
CREATE POLICY "participants_select_conversations" ON chat_conversations FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR auth.uid() = admin_id);

-- Authenticated users can create their own conversations
DROP POLICY IF EXISTS "user_insert_conversations" ON chat_conversations;
CREATE POLICY "user_insert_conversations" ON chat_conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Only admin can update/delete conversations
DROP POLICY IF EXISTS "admin_update_conversations" ON chat_conversations;
CREATE POLICY "admin_update_conversations" ON chat_conversations FOR UPDATE
  TO authenticated USING (auth.uid() = admin_id)
  WITH CHECK (auth.uid() = admin_id);

DROP POLICY IF EXISTS "admin_delete_conversations" ON chat_conversations;
CREATE POLICY "admin_delete_conversations" ON chat_conversations FOR DELETE
  TO authenticated USING (auth.uid() = admin_id);

-- ============ CHAT MESSAGES ============
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Participants of the parent conversation can view messages
DROP POLICY IF EXISTS "participants_select_messages" ON chat_messages;
CREATE POLICY "participants_select_messages" ON chat_messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = chat_messages.conversation_id
      AND (auth.uid() = c.user_id OR auth.uid() = c.admin_id)
    )
  );

-- Participants can insert messages (must be sender and part of conversation)
DROP POLICY IF EXISTS "participants_insert_messages" ON chat_messages;
CREATE POLICY "participants_insert_messages" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = chat_messages.conversation_id
      AND (auth.uid() = c.user_id OR auth.uid() = c.admin_id)
    )
  );

-- Only admin can delete messages
DROP POLICY IF EXISTS "admin_delete_messages" ON chat_messages;
CREATE POLICY "admin_delete_messages" ON chat_messages FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = chat_messages.conversation_id
      AND auth.uid() = c.admin_id
    )
  );

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_admin_id ON chat_conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
