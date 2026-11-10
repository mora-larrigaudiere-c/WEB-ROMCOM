-- ==============================================================================
-- FemCine: Esquema Público Compartido, Seguridad por Columnas y Moderación
-- Creadoras: Mora Larrigaudiere Curutchet & Oriana Fuentes (Diseñadoras Multimediales)
-- ==============================================================================
-- CARACTERÍSTICAS TÉCNICAS:
-- 1. Idempotente y aditivo.
-- 2. Privacidad estricta de emails: los emails NO se exponen a anon ni a otros usuarios.
--    Se revoca SELECT general y se concede GRANT SELECT explícito SOLO en:
--    (id, display_name, avatar_url, bio, created_at, updated_at).
-- 3. Grants de esquema y tablas explícitos (USAGE en public, SELECT en movies, etc.).
-- 4. Foreign Keys reales hacia public.profiles(id) para reviews y posts permitiendo joins limpios.
-- 5. Función is_admin con SECURITY DEFINER, search_path = public, pg_temp fijo y verificación auth.uid().
-- 6. Seed idempotente con ON CONFLICT DO NOTHING para preservar cambios y ediciones de admin.
-- 7. Constraints de integridad y creación de índices estratégicos de búsqueda.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant básico de uso de esquema public
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 1. TABLA DE PERFILES PÚBLICOS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, -- Privado: columna sin GRANT para anon
  display_name TEXT NOT NULL DEFAULT 'Cinéfila',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Revocar SELECT completo y otorgar SOLO las columnas públicas a anon y authenticated
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, display_name, avatar_url, bio, created_at, updated_at) ON public.profiles TO anon, authenticated;
-- El propio usuario sí puede leer su propia fila completa (incluyendo su email) vía función o política
GRANT INSERT (id, email, display_name, avatar_url, bio) ON public.profiles TO authenticated;
GRANT UPDATE (display_name, avatar_url, bio, updated_at) ON public.profiles TO authenticated;

-- Políticas de RLS en profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Perfiles públicos legibles'
  ) THEN
    CREATE POLICY "Perfiles públicos legibles"
      ON public.profiles FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Usuarios insertan su propio perfil'
  ) THEN
    CREATE POLICY "Usuarios insertan su propio perfil"
      ON public.profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Usuarios actualizan su propio perfil'
  ) THEN
    CREATE POLICY "Usuarios actualizan su propio perfil"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 2. TABLA DE ROLES ADMINISTRATIVOS (Privada)
CREATE TABLE IF NOT EXISTS public.admin_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'moderator')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Función is_admin segura: search_path fijado explícitamente para evitar secuestro de funciones
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF check_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = check_user_id AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Otorgar ejecución a anon y authenticated para comprobaciones en RLS
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon, authenticated;

-- Políticas para admin_roles: solo lectura del propio rol o de administradores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_roles' AND policyname = 'Lectura de propio rol o admin'
  ) THEN
    CREATE POLICY "Lectura de propio rol o admin"
      ON public.admin_roles FOR SELECT
      USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
  END IF;
END $$;

GRANT SELECT ON public.admin_roles TO authenticated;

-- 3. TABLA DE PELÍCULAS DEL CATÁLOGO PÚBLICO (movies)
CREATE TABLE IF NOT EXISTS public.movies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 1),
  year INTEGER NOT NULL CHECK (year >= 1888 AND year <= 2100),
  director TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0),
  genre TEXT NOT NULL,
  category TEXT NOT NULL,
  poster TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.movies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.movies TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'movies' AND policyname = 'Catálogo público legible por todos'
  ) THEN
    CREATE POLICY "Catálogo público legible por todos"
      ON public.movies FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'movies' AND policyname = 'Solo admin inserta películas'
  ) THEN
    CREATE POLICY "Solo admin inserta películas"
      ON public.movies FOR INSERT
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'movies' AND policyname = 'Solo admin actualiza películas'
  ) THEN
    CREATE POLICY "Solo admin actualiza películas"
      ON public.movies FOR UPDATE
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'movies' AND policyname = 'Solo admin elimina películas'
  ) THEN
    CREATE POLICY "Solo admin elimina películas"
      ON public.movies FOR DELETE
      USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- 4. PREFERENCIAS PRIVADAS DE USUARIO (movie_preferences)
CREATE TABLE IF NOT EXISTS public.movie_preferences (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id TEXT NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  user_rating INTEGER NOT NULL DEFAULT 0 CHECK (user_rating >= 0 AND user_rating <= 5),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, movie_id)
);

ALTER TABLE public.movie_preferences ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movie_preferences TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'movie_preferences' AND policyname = 'Usuario gestiona sus propias preferencias'
  ) THEN
    CREATE POLICY "Usuario gestiona sus propias preferencias"
      ON public.movie_preferences FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 5. RESEÑAS CINEMATOGRÁFICAS (reviews)
-- FK directa a public.profiles(id) para joins de autores
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id TEXT NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL CHECK (char_length(trim(content)) >= 10),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Lectura pública aprobada o autor o admin'
  ) THEN
    CREATE POLICY "Lectura pública aprobada o autor o admin"
      ON public.reviews FOR SELECT
      USING (
        status = 'approved' OR
        auth.uid() = user_id OR
        public.is_admin(auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Usuarios insertan sus reseñas en estado pendiente'
  ) THEN
    CREATE POLICY "Usuarios insertan sus reseñas en estado pendiente"
      ON public.reviews FOR INSERT
      WITH CHECK (
        auth.uid() = user_id AND
        (status = 'pending' OR public.is_admin(auth.uid()))
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Edición de reseñas autor o admin'
  ) THEN
    CREATE POLICY "Edición de reseñas autor o admin"
      ON public.reviews FOR UPDATE
      USING (
        auth.uid() = user_id OR
        public.is_admin(auth.uid())
      )
      WITH CHECK (
        public.is_admin(auth.uid()) OR
        (auth.uid() = user_id AND status = 'pending')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Eliminación de reseñas autor o admin'
  ) THEN
    CREATE POLICY "Eliminación de reseñas autor o admin"
      ON public.reviews FOR DELETE
      USING (
        auth.uid() = user_id OR
        public.is_admin(auth.uid())
      );
  END IF;
END $$;

-- 6. PUBLICACIONES DE LA COMUNIDAD (posts)
-- FK directa a public.profiles(id) para joins de autores
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 4),
  content TEXT NOT NULL CHECK (char_length(trim(content)) >= 20),
  category TEXT DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Lectura pública posts aprobados o autor o admin'
  ) THEN
    CREATE POLICY "Lectura pública posts aprobados o autor o admin"
      ON public.posts FOR SELECT
      USING (
        status = 'approved' OR
        auth.uid() = user_id OR
        public.is_admin(auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Usuarios crean posts en pending'
  ) THEN
    CREATE POLICY "Usuarios crean posts en pending"
      ON public.posts FOR INSERT
      WITH CHECK (
        auth.uid() = user_id AND
        (status = 'pending' OR public.is_admin(auth.uid()))
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Edición de posts autor o admin'
  ) THEN
    CREATE POLICY "Edición de posts autor o admin"
      ON public.posts FOR UPDATE
      USING (
        auth.uid() = user_id OR
        public.is_admin(auth.uid())
      )
      WITH CHECK (
        public.is_admin(auth.uid()) OR
        (auth.uid() = user_id AND status = 'pending')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Eliminación de posts autor o admin'
  ) THEN
    CREATE POLICY "Eliminación de posts autor o admin"
      ON public.posts FOR DELETE
      USING (
        auth.uid() = user_id OR
        public.is_admin(auth.uid())
      );
  END IF;
END $$;

-- 7. ÍNDICES DE RENDIMIENTO Y BÚSQUEDA
CREATE INDEX IF NOT EXISTS idx_movies_category ON public.movies (category);
CREATE INDEX IF NOT EXISTS idx_movies_year ON public.movies (year DESC);
CREATE INDEX IF NOT EXISTS idx_movie_prefs_user ON public.movie_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_movie_status ON public.reviews (movie_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user ON public.posts (user_id);

-- 8. TRIGGER DE PERFILES CON SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, 'cinéfila'), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(NULLIF(public.profiles.display_name, ''), EXCLUDED.display_name),
    avatar_url = COALESCE(NULLIF(public.profiles.avatar_url, ''), EXCLUDED.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. SEED IDEMPOTENTE CON ON CONFLICT DO NOTHING (Preserva ediciones de las admin)
INSERT INTO public.movies (id, title, year, director, duration, genre, category, poster, synopsis)
VALUES
  ('diez-cosas-que-odio-de-ti', '10 cosas que odio de ti', 1999, 'Gil Junger', 97, 'Comedia romántica', 'romcom', 'diez-cosas', 'Cuando Bianca no puede salir con nadie hasta que su hermana mayor lo haga, un chico de la escuela organiza una cita muy poco inocente para la temida Kat Stratford.'),
  ('anyone-but-you', 'Anyone but You', 2023, 'Will Gluck', 103, 'Comedia romántica', 'romcom', 'anyone-but-you', 'Bea y Ben tienen una primera cita perfecta y un final desastroso. Meses después coinciden en una boda en Australia y fingen ser pareja para sobrevivir al fin de semana.'),
  ('bottoms', 'Bottoms', 2023, 'Emma Seligman', 92, 'Comedia', 'romcom', 'bottoms', 'Dos amigas impopulares fundan un club de pelea en su secundaria para acercarse a las chicas que les gustan, y el plan se les va de las manos.'),
  ('a-cinderella-story', 'A Cinderella Story', 2004, 'Mark Rosman', 95, 'Comedia romántica', 'romcom', 'cinderella-story', 'Sam trabaja sin descanso para su madrastra y chatea cada noche con un desconocido. Lo que no sabe es que ese chico es el más popular de su escuela.'),
  ('the-ugly-stepsister', 'The Ugly Stepsister', 2025, 'Emilie Blichfeldt', 109, 'Terror y comedia', 'terror', 'ugly-stepsister', 'Una relectura sangrienta de Cenicienta desde el lado de la hermanastra, dispuesta a todo para encajar en los estándares de belleza de la corte.'),
  ('how-to-lose-a-guy-in-10-days', 'How to Lose a Guy in 10 Days', 2003, 'Donald Petrie', 116, 'Comedia romántica', 'romcom', 'how-to-lose-a-guy', 'Una periodista debe espantar a un hombre en diez días para su nota. Él, por una apuesta, debe lograr que ella se enamore en el mismo plazo.'),
  ('just-my-luck', 'Just My Luck', 2006, 'Donald Petrie', 103, 'Comedia romántica', 'romcom', 'just-my-luck', 'Ashley tiene una suerte envidiable hasta que un beso intercambia su buena fortuna con la de un chico que siempre atrae los problemas.'),
  ('love-rosie', 'Love, Rosie', 2014, 'Christian Ditter', 102, 'Comedia romántica', 'llanto', 'love-rosie', 'Rosie y Alex son mejores amigos desde la infancia. Entre malentendidos, distancias y mala sincronía, tardan años en admitir lo que sienten.'),
  ('me-before-you', 'Me Before You', 2016, 'Thea Sharrock', 106, 'Drama romántico', 'llanto', 'me-before-you', 'Louisa consigue trabajo como cuidadora de Will, un joven que quedó tetrapléjico. Entre ambos nace un vínculo que cambia la forma en que los dos ven la vida.'),
  ('notting-hill', 'Notting Hill', 1999, 'Roger Michell', 124, 'Comedia romántica', 'romcom', 'notting-hill', 'Un librero londinense común y corriente se cruza con la actriz más famosa del mundo. Descubrir si el amor puede sobrevivir a la fama es la parte difícil.'),
  ('pretty-woman', 'Pretty Woman', 1990, 'Garry Marshall', 119, 'Comedia romántica', 'romcom', 'pretty-woman', 'Un empresario contrata a Vivian para que lo acompañe durante una semana. Lo que empieza como un trato termina por volverse algo mucho más complicado.'),
  ('priscilla', 'Priscilla', 2023, 'Sofia Coppola', 113, 'Drama biográfico', 'epoca', 'priscilla', 'La historia de Priscilla Presley, desde su adolescencia hasta su vida en Graceland junto a Elvis, contada desde su propia mirada.'),
  ('shes-all-that', 'She''s All That', 1999, 'Robert Iscove', 95, 'Comedia romántica', 'romcom', 'shes-all-that', 'Tras una ruptura, el chico más popular apuesta que puede transformar a cualquier compañera en la reina del baile. Elige a Laney, la artista solitaria.'),
  ('shes-the-man', 'She''s the Man', 2006, 'Andy Fickman', 105, 'Comedia romántica', 'romcom', 'shes-the-man', 'Cuando cancelan el equipo femenino de fútbol, Viola se hace pasar por su hermano gemelo para jugar en otro colegio y termina enredada en un lío amoroso.'),
  ('the-notebook', 'The Notebook', 2004, 'Nick Cassavetes', 123, 'Drama romántico', 'llanto', 'the-notebook', 'Un hombre mayor lee a una mujer la historia de dos jóvenes de clases sociales distintas que se enamoraron en un verano en el sur de Estados Unidos.'),
  ('x', 'X', 2022, 'Ti West', 105, 'Terror', 'terror', 'x', 'Un equipo de rodaje alquila una granja aislada en Texas para filmar una película para adultos, sin saber que sus dueños mayores los vigilan.')
ON CONFLICT (id) DO NOTHING;
