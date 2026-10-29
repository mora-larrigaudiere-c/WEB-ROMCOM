import test from 'node:test';
import assert from 'node:assert/strict';

// LocalStorage simulado para Node.
function installStorage(initial = {}, opts = {}) {
  const data = { ...initial };
  globalThis.localStorage = {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      if (opts.failWrites) {
        const e = new Error('lleno');
        e.name = 'QuotaExceededError';
        throw e;
      }
      data[k] = String(v);
    },
    removeItem: (k) => delete data[k]
  };
  return data;
}

const repo = await import('../src/services/movieRepository.js');
const { SEED_MOVIES } = await import('../src/data/seedMovies.js');
const { validateMovie, hasErrors, validateEmail, isValidUrl } = await import('../src/utils/validators.js');
const { filterAndSort, parseFilters, normalizeText } = await import('../src/utils/catalogQuery.js');
const { formToMovie, movieToForm } = await import('../src/utils/movieForm.js');
const { fetchGhibliFilms, ApiError } = await import('../src/services/ghibliService.js');
const news = await import('../src/services/newsletterService.js');
const { CATEGORY_IDS } = await import('../src/data/categories.js');

const POSTER_KEYS = ['diez-cosas', 'x'];

test('catálogo de ejemplo: 15 o más películas distintas, ids únicos, categorías válidas', () => {
  assert.ok(SEED_MOVIES.length >= 15);
  assert.equal(new Set(SEED_MOVIES.map((m) => m.id)).size, SEED_MOVIES.length);
  assert.equal(new Set(SEED_MOVIES.map((m) => m.poster)).size, SEED_MOVIES.length);
  for (const m of SEED_MOVIES) assert.ok(CATEGORY_IDS.includes(m.category), m.title);
  assert.ok(!SEED_MOVIES.some((m) => m.poster === 'diez-things'), 'la otra portada no es otro registro');
});

test('primera carga siembra y guarda; recarga mantiene lo guardado', () => {
  const store = installStorage();
  const first = repo.loadMovies();
  assert.equal(first.error, null);
  assert.equal(first.movies.length, SEED_MOVIES.length);
  assert.ok(store[repo.MOVIES_KEY]);
  const edited = first.movies.slice(1);
  assert.equal(repo.saveMovies(edited), null);
  const again = repo.loadMovies();
  assert.equal(again.movies.length, SEED_MOVIES.length - 1);
});

test('un catálogo vacío es válido y no se repone', () => {
  installStorage();
  repo.saveMovies([]);
  const loaded = repo.loadMovies();
  assert.equal(loaded.movies.length, 0);
  assert.equal(loaded.error, null);
});

test('datos corruptos: se avisa y se muestran ejemplos sin lanzar', () => {
  installStorage({ [repo.MOVIES_KEY]: '{no es json' });
  const loaded = repo.loadMovies();
  assert.ok(loaded.error && loaded.error.includes('dañados'));
  assert.equal(loaded.movies.length, SEED_MOVIES.length);
});

test('error de escritura devuelve mensaje comprensible', () => {
  installStorage({}, { failWrites: true });
  const msg = repo.saveMovies([]);
  assert.ok(msg && msg.includes('espacio'));
});

test('sin localStorage disponible no se rompe', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('bloqueado'); } });
  const loaded = repo.loadMovies();
  assert.ok(loaded.error);
  assert.equal(loaded.movies.length, SEED_MOVIES.length);
  delete globalThis.localStorage;
});

test('createId es único y evita la palabra reservada "nueva"', () => {
  assert.equal(repo.createId('Amélie & Co.', []), 'amelie-co');
  assert.equal(repo.createId('X', ['x']), 'x-2');
  assert.equal(repo.createId('Nueva', []), 'nueva-pelicula');
});

const valid = {
  title: 'Mean Girls', year: '2004', director: 'Mark Waters', duration: '97', genre: 'Comedia',
  category: 'romcom', posterMode: 'manifest', posterKey: 'x', posterUrl: '', synopsis: 'Una chica nueva descubre el peligro de la secundaria.'
};

test('validaciones: formulario válido no tiene errores', () => {
  assert.equal(hasErrors(validateMovie(valid, { posterKeys: POSTER_KEYS })), false);
});

test('validaciones: obligatorios, longitudes, año, duración, categoría y URL', () => {
  const e = validateMovie({ ...valid, title: '', year: '19.5', director: 'ab', duration: '0', genre: '', category: 'comedia', synopsis: 'corta' }, { posterKeys: POSTER_KEYS });
  for (const f of ['title', 'year', 'director', 'duration', 'genre', 'category', 'synopsis']) assert.ok(e[f], f);
  assert.ok(validateMovie({ ...valid, year: '1500' }, { posterKeys: POSTER_KEYS }).year);
  assert.ok(validateMovie({ ...valid, duration: '-5' }, { posterKeys: POSTER_KEYS }).duration);
  assert.ok(validateMovie({ ...valid, posterMode: 'url', posterUrl: 'no-es-url' }, { posterKeys: POSTER_KEYS }).poster);
  assert.equal(validateMovie({ ...valid, posterMode: 'url', posterUrl: 'https://ejemplo.com/p.jpg' }, { posterKeys: POSTER_KEYS }).poster, undefined);
  assert.ok(validateMovie({ ...valid, posterKey: 'inexistente' }, { posterKeys: POSTER_KEYS }).poster);
  assert.equal(isValidUrl('javascript:alert(1)'), false);
});

test('validación de correo', () => {
  assert.ok(validateEmail(''));
  assert.ok(validateEmail('a@b'));
  assert.equal(validateEmail('hola@femcine.com'), '');
});

test('formToMovie / movieToForm son inversos y trabajan con copias', () => {
  const movie = formToMovie(valid);
  assert.equal(movie.year, 2004);
  assert.equal(movie.poster, 'x');
  const form = movieToForm(movie, POSTER_KEYS);
  assert.equal(form.year, '2004');
  assert.notEqual(form, movie);
  const urlMovie = formToMovie({ ...valid, posterMode: 'url', posterUrl: ' https://a.com/p.png ' });
  assert.equal(movieToForm(urlMovie, POSTER_KEYS).posterMode, 'url');
});

test('búsqueda, categoría y orden combinados', () => {
  const m = SEED_MOVIES;
  assert.equal(filterAndSort(m, { query: 'notting' }).length, 1);
  assert.equal(filterAndSort(m, { query: 'NOTTING' }).length, 1);
  assert.equal(filterAndSort(m, { category: 'terror' }).length, 2);
  assert.equal(filterAndSort(m, { category: 'musical' }).length, 0);
  assert.equal(filterAndSort(m, { query: 'x', category: 'terror' }).length, 1);
  assert.equal(filterAndSort(m, { query: 'x', category: 'llanto' }).length, 0);
  const byYear = filterAndSort(m, { category: 'romcom', sort: 'anio-asc' });
  assert.equal(byYear[0].title, 'Pretty Woman');
  const desc = filterAndSort(m, { sort: 'titulo-desc' });
  assert.equal(desc[0].title, 'X');
  const asc = filterAndSort(m, { sort: 'titulo-asc' });
  assert.equal(asc[0].title, '10 cosas que odio de ti');
  assert.equal(normalizeText('  ÉPOCA '), 'epoca');
});

test('parseFilters sanea valores de la URL', () => {
  assert.deepEqual(parseFilters({ q: 'a', categoria: 'zzz', orden: 'raro' }), { query: 'a', category: '', sort: 'titulo-asc' });
  assert.deepEqual(parseFilters({ categoria: 'epoca', orden: 'anio-desc' }), { query: '', category: 'epoca', sort: 'anio-desc' });
});

test('Fetch: respuesta correcta se normaliza', async () => {
  const fake = async () => ({ ok: true, json: async () => [{ id: 'a', title: 'Totoro', image: 'http://i', release_date: '1988', director: 'H. Miyazaki', running_time: '86' }, { id: 'b' }] });
  const films = await fetchGhibliFilms({ fetchImpl: fake });
  assert.equal(films.length, 1);
  assert.equal(films[0].duration, 86);
});

test('Fetch: errores de red, HTTP y formato dan ApiError', async () => {
  await assert.rejects(fetchGhibliFilms({ fetchImpl: async () => { throw new TypeError('Failed to fetch'); } }), ApiError);
  await assert.rejects(fetchGhibliFilms({ fetchImpl: async () => ({ ok: false, status: 503 }) }), /503/);
  await assert.rejects(fetchGhibliFilms({ fetchImpl: async () => ({ ok: true, json: async () => ({}) }) }), ApiError);
  await assert.rejects(fetchGhibliFilms({ fetchImpl: async () => ({ ok: true, json: async () => { throw new Error('x'); } }) }), ApiError);
});

test('Fetch: timeout y cancelación', async () => {
  const hang = (url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => { const e = new Error('abort'); e.name = 'AbortError'; reject(e); }));
  await assert.rejects(fetchGhibliFilms({ fetchImpl: hang, timeoutMs: 20 }), /tardó demasiado/);
  const ctrl = new AbortController();
  const p = fetchGhibliFilms({ fetchImpl: hang, signal: ctrl.signal, timeoutMs: 5000 });
  ctrl.abort();
  await assert.rejects(p, (e) => e.name === 'AbortError');
});

test('newsletter: guarda localmente y detecta duplicados', () => {
  installStorage();
  assert.equal(news.addSubscriber(' Hola@FemCine.com '), 'added');
  assert.equal(news.addSubscriber('hola@femcine.com'), 'exists');
  installStorage({}, { failWrites: true });
  assert.throws(() => news.addSubscriber('a@b.com'), /espacio/);
});
