-- ==============================================================================
-- FemCine: Script Manual de Asignación de Rol Administrador
-- ==============================================================================
-- INSTRUCCIONES:
-- 1. Cuando las creadoras (Mora Larrigaudiere Curutchet u Oriana Fuentes)
--    inicien sesión por primera vez con Google OAuth, Supabase creará su fila
--    en la tabla 'auth.users' y 'public.profiles'.
-- 2. Copiá el UUID de la usuaria desde el panel de Supabase (Authentication > Users)
--    o ejecutá:
--      SELECT id, email FROM auth.users WHERE email = 'tu_correo@gmail.com';
-- 3. Reemplazá el UUID en la siguiente consulta y ejecutala en el SQL Editor de Supabase:
-- ==============================================================================

-- Ejemplo de inserción de rol para Mora u Oriana:
-- Reemplazar '00000000-0000-0000-0000-000000000000' por el UUID real correspondiente:

/*
INSERT INTO public.admin_roles (user_id, role, notes)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin',
  'Creadora y Administradora de FemCine'
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  assigned_at = NOW(),
  notes = 'Creadora y Administradora de FemCine';
*/

-- Para verificar quiénes tienen rol de administración:
SELECT
  a.user_id,
  p.email,
  p.display_name,
  a.role,
  a.assigned_at,
  a.notes
FROM public.admin_roles a
LEFT JOIN public.profiles p ON p.id = a.user_id;
