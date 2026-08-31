-- Assign Admin role to meera.krishnan@example.com
INSERT INTO user_roles (user_id, role_id, granted_at)
SELECT 
  u.id as user_id,
  r.id as role_id,
  NOW() as granted_at
FROM users u
CROSS JOIN roles r
WHERE u.email = 'meera.krishnan@example.com'
  AND r.name = 'Admin'
  AND r.scope = 'PLATFORM'
ON CONFLICT (user_id, role_id, store_id) DO NOTHING;
