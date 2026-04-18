-- Create test user account
-- Email: iriasnandinho@gmail.com
-- This creates a user in Supabase Auth that can login via magic link

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'iriasnandinho@gmail.com',
  crypt('temporary-password-change-via-magic-link', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false
);

-- Also create identity record for email authentication
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  id,
  id::text,
  jsonb_build_object('sub', id::text, 'email', 'iriasnandinho@gmail.com'),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'iriasnandinho@gmail.com';
