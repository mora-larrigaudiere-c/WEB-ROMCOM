// Repositorio y cliente de servicios para Supabase y modo Local
// Administra: Catálogo público compartido (movies), preferencias personales (movie_preferences),
// reseñas de películas (reviews) y publicaciones comunitarias (posts).
// Principio de privacidad: no cachea datos privados de usuarios en caché pública.

import { getSupabase } from './supabaseClient.js';
import { normalizeMovie } from './movieRepository.js';

// Claves de LocalStorage aisladas por usuario para evitar filtraciones
export const CACHE_KEYS = {
  PUBLIC_MOVIES: 'femcine:cache:public_movies:v2',
  userPrefs: (uid) => `femcine:user:${uid}:prefs:v2`,
  userReviews: (uid) => `femcine:user:${uid}:reviews:v2`,
  userPosts: (uid) => `femcine:user:${uid}:posts:v2`
};

function readLocal(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[FemCine] Error al escribir en almacenamiento local:', e);
  }
}

// ==============================================================================
// 1. VERIFICACIÓN DE ROL ADMINISTRADOR (A través de la tabla admin_roles y RLS)
// ==============================================================================
export async function checkAdminRole(userId) {
  if (!userId) return false;
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return false;
    return data && (data.role === 'admin' || data.role === 'moderator');
  } catch (err) {
    return false;
  }
}

// ==============================================================================
// 2. CATÁLOGO PÚBLICO COMPARTIDO (movies)
// ==============================================================================
export async function fetchPublicMovies() {
  const supabase = getSupabase();
  if (!supabase) {
    return null; // Forzar uso de modo local de respaldo
  }

  const { data, error } = await supabase
    .from('movies')
    .select('id, title, year, director, duration, genre, category, poster, synopsis')
    .order('year', { ascending: false });

  if (error) throw error;
  const normalized = (data || []).map((row) =>
    normalizeMovie({
      id: row.id,
      title: row.title,
      year: row.year,
      director: row.director,
      duration: row.duration,
      genre: row.genre,
      category: row.category,
      poster: row.poster,
      synopsis: row.synopsis
    })
  );
  writeLocal(CACHE_KEYS.PUBLIC_MOVIES, normalized);
  return normalized;
}

export async function insertAdminMovie(movie) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase no está configurado');

  const payload = {
    id: movie.id,
    title: movie.title,
    year: Number(movie.year),
    director: movie.director,
    duration: Number(movie.duration),
    genre: movie.genre,
    category: movie.category,
    poster: movie.poster,
    synopsis: movie.synopsis,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('movies')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return normalizeMovie(data);
}

export async function updateAdminMovie(id, movie) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase no está configurado');

  const payload = {
    title: movie.title,
    year: Number(movie.year),
    director: movie.director,
    duration: Number(movie.duration),
    genre: movie.genre,
    category: movie.category,
    poster: movie.poster,
    synopsis: movie.synopsis,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('movies')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return normalizeMovie(data);
}

export async function deleteAdminMovie(id) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase no está configurado');

  const { error } = await supabase
    .from('movies')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==============================================================================
// 3. PREFERENCIAS PRIVADAS DE USUARIO (Favoritos y Calificaciones)
// ==============================================================================
export async function fetchUserPreferences(userId) {
  if (!userId) return {};
  const supabase = getSupabase();
  if (!supabase) return readLocal(CACHE_KEYS.userPrefs(userId), {}) || {};

  try {
    const { data, error } = await supabase
      .from('movie_preferences')
      .select('movie_id, is_favorite, user_rating')
      .eq('user_id', userId);

    if (error) throw error;
    const map = {};
    (data || []).forEach((row) => {
      map[row.movie_id] = {
        isFavorite: Boolean(row.is_favorite),
        userRating: Number(row.user_rating) || 0
      };
    });
    writeLocal(CACHE_KEYS.userPrefs(userId), map);
    return map;
  } catch (e) {
    return readLocal(CACHE_KEYS.userPrefs(userId), {}) || {};
  }
}

/**
 * Upsert atómico que preserva tanto favorito como calificación previa
 */
export async function upsertUserPreference(userId, movieId, { isFavorite, userRating }) {
  if (!userId) return;
  const supabase = getSupabase();

  // Leer estado previo en memoria/caché del usuario para evitar sobreescrituras parciales
  const userPrefs = readLocal(CACHE_KEYS.userPrefs(userId), {}) || {};
  const current = userPrefs[movieId] || { isFavorite: false, userRating: 0 };

  const finalFavorite = isFavorite !== undefined ? Boolean(isFavorite) : current.isFavorite;
  const finalRating = userRating !== undefined ? (Number(userRating) || 0) : current.userRating;

  userPrefs[movieId] = {
    isFavorite: finalFavorite,
    userRating: finalRating
  };
  writeLocal(CACHE_KEYS.userPrefs(userId), userPrefs);

  if (supabase) {
    const payload = {
      user_id: userId,
      movie_id: movieId,
      is_favorite: finalFavorite,
      user_rating: finalRating,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('movie_preferences')
      .upsert(payload, { onConflict: 'user_id,movie_id' });

    if (error) throw error;
  }
}

// ==============================================================================
// 4. RESEÑAS CINEMATOGRÁFICAS (reviews)
// ==============================================================================
export async function fetchMovieReviews(movieId) {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id, movie_id, user_id, rating, title, content, status, created_at,
      profiles (display_name, avatar_url)
    `)
    .eq('movie_id', movieId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    movieId: row.movie_id,
    userId: row.user_id,
    rating: row.rating,
    title: row.title || '',
    content: row.content,
    status: row.status,
    authorName: row.profiles?.display_name || 'Cinéfila',
    authorAvatar: row.profiles?.avatar_url || '',
    createdAt: row.created_at
  }));
}

export async function fetchUserReviews(userId) {
  if (!userId) return [];
  const supabase = getSupabase();
  if (!supabase) return readLocal(CACHE_KEYS.userReviews(userId), []) || [];

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id, movie_id, user_id, rating, title, content, status, created_at,
      movies (title)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const mapped = (data || []).map((row) => ({
    id: row.id,
    movieId: row.movie_id,
    movieTitle: row.movies?.title || 'Película',
    userId: row.user_id,
    rating: row.rating,
    title: row.title || '',
    content: row.content,
    status: row.status,
    createdAt: row.created_at
  }));
  writeLocal(CACHE_KEYS.userReviews(userId), mapped);
  return mapped;
}

export async function createReview(userId, { movieId, rating, title, content }) {
  const supabase = getSupabase();
  const payload = {
    movie_id: movieId,
    user_id: userId,
    rating: Number(rating) || 5,
    title: title ? title.trim() : null,
    content: content.trim(),
    status: 'pending'
  };

  if (!supabase) {
    const fallbackReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      movieId,
      userId,
      rating: payload.rating,
      title: payload.title || '',
      content: payload.content,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    const list = readLocal(CACHE_KEYS.userReviews(userId), []) || [];
    list.unshift(fallbackReview);
    writeLocal(CACHE_KEYS.userReviews(userId), list);
    return fallbackReview;
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    movieId: data.movie_id,
    userId: data.user_id,
    rating: data.rating,
    title: data.title || '',
    content: data.content,
    status: data.status,
    createdAt: data.created_at
  };
}

export async function updateReview(reviewId, userId, { rating, title, content }) {
  const supabase = getSupabase();
  const payload = {
    rating: Number(rating) || 5,
    title: title ? title.trim() : null,
    content: content.trim(),
    status: 'pending', // RLS exige que status sea pending al actualizar por el autor
    updated_at: new Date().toISOString()
  };

  if (!supabase) {
    const list = readLocal(CACHE_KEYS.userReviews(userId), []) || [];
    const idx = list.findIndex((r) => r.id === reviewId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...payload };
      writeLocal(CACHE_KEYS.userReviews(userId), list);
      return list[idx];
    }
    throw new Error('Reseña no encontrada');
  }

  const { data, error } = await supabase
    .from('reviews')
    .update(payload)
    .eq('id', reviewId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReview(reviewId, userId, isAdmin = false) {
  const supabase = getSupabase();
  if (!supabase) {
    const list = readLocal(CACHE_KEYS.userReviews(userId), []) || [];
    writeLocal(CACHE_KEYS.userReviews(userId), list.filter((r) => r.id !== reviewId));
    return;
  }

  let query = supabase.from('reviews').delete().eq('id', reviewId);
  if (!isAdmin) {
    query = query.eq('user_id', userId);
  }
  const { error } = await query;
  if (error) throw error;
}

// ==============================================================================
// 5. PUBLICACIONES COMUNITARIAS (posts)
// ==============================================================================
export async function fetchCommunityPosts() {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, user_id, title, content, category, status, created_at,
      profiles (display_name, avatar_url)
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    category: row.category || 'general',
    status: row.status,
    authorName: row.profiles?.display_name || 'Cinéfila',
    authorAvatar: row.profiles?.avatar_url || '',
    createdAt: row.created_at
  }));
}

export async function fetchUserPosts(userId) {
  if (!userId) return [];
  const supabase = getSupabase();
  if (!supabase) return readLocal(CACHE_KEYS.userPosts(userId), []) || [];

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  writeLocal(CACHE_KEYS.userPosts(userId), data || []);
  return data || [];
}

export async function createPost(userId, { title, content, category = 'general' }) {
  const supabase = getSupabase();
  const payload = {
    user_id: userId,
    title: title.trim(),
    content: content.trim(),
    category: category.trim(),
    status: 'pending'
  };

  if (!supabase) {
    const fallbackPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      ...payload,
      createdAt: new Date().toISOString()
    };
    const list = readLocal(CACHE_KEYS.userPosts(userId), []) || [];
    list.unshift(fallbackPost);
    writeLocal(CACHE_KEYS.userPosts(userId), list);
    return fallbackPost;
  }

  const { data, error } = await supabase
    .from('posts')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePost(postId, userId, { title, content, category }) {
  const supabase = getSupabase();
  const payload = {
    title: title.trim(),
    content: content.trim(),
    category: category || 'general',
    status: 'pending',
    updated_at: new Date().toISOString()
  };

  if (!supabase) {
    const list = readLocal(CACHE_KEYS.userPosts(userId), []) || [];
    const idx = list.findIndex((p) => p.id === postId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...payload };
      writeLocal(CACHE_KEYS.userPosts(userId), list);
      return list[idx];
    }
    throw new Error('Publicación no encontrada');
  }

  const { data, error } = await supabase
    .from('posts')
    .update(payload)
    .eq('id', postId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(postId, userId, isAdmin = false) {
  const supabase = getSupabase();
  if (!supabase) {
    const list = readLocal(CACHE_KEYS.userPosts(userId), []) || [];
    writeLocal(CACHE_KEYS.userPosts(userId), list.filter((p) => p.id !== postId));
    return;
  }

  let query = supabase.from('posts').delete().eq('id', postId);
  if (!isAdmin) {
    query = query.eq('user_id', userId);
  }
  const { error } = await query;
  if (error) throw error;
}

// ==============================================================================
// 6. PANEL DE MODERACIÓN (SOLO ADMINISTRADORAS)
// ==============================================================================
export async function fetchPendingModeration() {
  const supabase = getSupabase();
  if (!supabase) {
    return { reviews: [], posts: [] };
  }

  const [reviewsRes, postsRes] = await Promise.all([
    supabase
      .from('reviews')
      .select(`
        id, movie_id, user_id, rating, title, content, status, created_at,
        movies (title),
        profiles (display_name, avatar_url)
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('posts')
      .select(`
        id, user_id, title, content, category, status, created_at,
        profiles (display_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
  ]);

  if (reviewsRes.error) throw reviewsRes.error;
  if (postsRes.error) throw postsRes.error;

  const reviews = (reviewsRes.data || []).map((row) => ({
    id: row.id,
    movieId: row.movie_id,
    movieTitle: row.movies?.title || 'Película',
    userId: row.user_id,
    rating: row.rating,
    title: row.title || '',
    content: row.content,
    status: row.status,
    authorName: row.profiles?.display_name || 'Cinéfila',
    authorAvatar: row.profiles?.avatar_url || '',
    createdAt: row.created_at
  }));

  const posts = (postsRes.data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    category: row.category,
    status: row.status,
    authorName: row.profiles?.display_name || 'Cinéfila',
    authorAvatar: row.profiles?.avatar_url || '',
    createdAt: row.created_at
  }));

  return { reviews, posts };
}

export async function moderateContent({ type, id, status, adminUserId }) {
  const supabase = getSupabase();
  const table = type === 'review' ? 'reviews' : 'posts';

  if (!supabase) {
    throw new Error('La moderación requiere conexión con Supabase');
  }

  const payload = {
    status,
    moderated_by: adminUserId,
    moderated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from(table)
    .update(payload)
    .eq('id', id);

  if (error) throw error;
}

// ==============================================================================
// 7. PERFIL PÚBLICO DE USUARIO (profiles)
// ==============================================================================
export async function fetchProfile(userId) {
  if (!userId) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, bio')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId, { displayName, bio, avatarUrl }) {
  const supabase = getSupabase();
  if (!supabase) return;

  const payload = {
    display_name: displayName ? displayName.trim() : 'Cinéfila',
    bio: bio ? bio.trim() : '',
    updated_at: new Date().toISOString()
  };
  if (avatarUrl !== undefined) payload.avatar_url = avatarUrl;

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId);

  if (error) throw error;
}
