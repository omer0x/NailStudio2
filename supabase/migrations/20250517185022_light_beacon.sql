/*
  # Update admin user is_super_admin field

  1. Changes
    - Set is_super_admin to null for admin@medinanails.com user
*/

-- Update the admin user's is_super_admin field
UPDATE auth.users
SET is_super_admin = true
WHERE email = 'admin@medinanails.com';