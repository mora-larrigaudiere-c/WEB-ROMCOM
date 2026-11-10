// Servicio de persistencia en la nube utilizando Supabase.
// Permite que cada usuario autenticado tenga su propio catálogo privado y sus solicitudes.
import { getSupabase } from './supabaseClient';
import { normalizeMovie } from './movieRepository';
import { normalizeRequest } from './requestsRepository';

function movieToRow(userId, movie) {
  return {
    id: movie.id,
    user_id: userId,
    title: movie.title,
    year: Number(movie.year),
    director: movie.director,
    duration: Number(movie.duration),
    genre: movie.genre,
    category: movie.category,
    poster: movie.poster,
    synopsis: movie.synopsis,
    is_favorite: Boolean(movie.isFavorite),
    user_rating: Number(movie.userRating) || 0,
    updated_at: new Date().toISOString()
  };
}

function rowToMovie(row) {
  return normalizeMovie({
    id: row.id,
    title: row.title,
    year: row.year,
    director: row.director,
    duration: row.duration,
    genre: row.genre,
    category: row.category,
    poster: row.poster,
    synopsis: row.synopsis,
    isFavorite: Boolean(row.is_favorite),
    userRating: Number(row.user_rating) || 0
  });
}

function requestToRow(userId, req) {
  return {
    id: req.id.startsWith('req-') ? undefined : req.id,
    user_id: userId,
    title: req.title,
    category: req.category,
    year: req.year ? Number(req.year) : null,
    reason: req.reason,
    reference_url: req.referenceUrl || null,
    status: req.status || 'Pendiente'
  };
}

function rowToRequest(row) {
  return normalizeRequest({
    id: String(row.id),
    title: row.title,
    category: row.category,
    year: row.year,
    reason: row.reason,
    referenceUrl: row.reference_url || '',
    status: row.status || 'Pendiente',
    createdAt: row.created_at
  });
}

// ==========================================
// OPERACIONES DE PELÍCULAS EN LA NUBE
// ==========================================

export async function fetchUserMovies(userId) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase no disponible');

  const { data, error } = await supabase
    .from('user_movies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(rowToMovie);
}

export async function upsertUserMovie(userId, movie) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase no disponible');

  const row = movieToRow(userId, movie);
  const { data, error } = await supabase
    .from('user_movies')
    .upsert(row, { onConflict: 'user_id,id' })
    .select()
    .single();

  if (error) throw error;
  return rowToMovie(data);
}

export async function deleteUserMovie(userId, movieId) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase no disponible');

  const { error } = await supabase
    .from('user_movies')
    .delete()
    .eq('user_id', userId)
    .eq('id', movieId);

  if (error) throw error;
}

export async function importLocalMoviesToCloud(userId, localMovies) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase no disponible');
  if (!Array.isArray(localMovies) || !localMovies.length) return [];

  const rows = localMovies.map((m) => movieToRow(userId, m));
  const { data, error } = await supabase
    .from('user_movies')
    .upsert(rows, { onConflict: 'user_id,id' })
    .select();

  if (error) throw error;
  return (data || []).map(rowToMovie);
}

// ==========================================
// OPERACIONES DE SOLICITUDES EN LA NUBE
// ==========================================

export async function fetchUserRequests(userId) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase no disponible');

  const { data, error } = await supabase
    .from('movie_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(rowToRequest);
}

export async function insertUserRequest(userId, requestData) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase no disponible');

  const row = requestToRow(userId, requestData);
  // Omitimos id para que Postgres use gen_random_uuid()
  delete row.id;

  const { data, error } = await supabase
    .from('movie_requests')
    .insert([row])
    .select()
    .single();

  if (error) throw error;
  return rowToRequest(data);
}

export async function deleteUserRequest(userId, requestId) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase no disponible');

  const { error } = await supabase
    .from('movie_requests')
    .delete()
    .eq('user_id', userId)
    .eq('id', requestId);

  if (error) throw error;
}
