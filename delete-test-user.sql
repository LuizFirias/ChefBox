-- Delete user created manually or via script
-- Email: iriasnandinho@gmail.com

-- First delete from identities table
DELETE FROM auth.identities 
WHERE provider_id IN (
  SELECT id::text FROM auth.users WHERE email = 'iriasnandinho@gmail.com'
);

-- Then delete from users table
DELETE FROM auth.users 
WHERE email = 'iriasnandinho@gmail.com';

-- Verify deletion
SELECT COUNT(*) as remaining_users 
FROM auth.users 
WHERE email = 'iriasnandinho@gmail.com';
