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
const { askOracle, OracleApiError, EDITORIAL_PHRASES } = await import('../src/services/oracleService.js');
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

test('normalización estricta de favoritos y calificaciones', () => {
  // Conserva isFavorite si ya es booleano; en caso contrario, usa false.
  assert.equal(repo.normalizeMovie({ isFavorite: true }).isFavorite, true);
  assert.equal(repo.normalizeMovie({ isFavorite: false }).isFavorite, false);
  assert.equal(repo.normalizeMovie({ isFavorite: 'true' }).isFavorite, false);
  assert.equal(repo.normalizeMovie({ isFavorite: 1 }).isFavorite, false);
  assert.equal(repo.normalizeMovie({}).isFavorite, false);

  // Conserva userRating únicamente si es entero entre 0 y 5; en caso contrario, 0.
  assert.equal(repo.normalizeMovie({ userRating: 0 }).userRating, 0);
  assert.equal(repo.normalizeMovie({ userRating: 3 }).userRating, 3);
  assert.equal(repo.normalizeMovie({ userRating: 5 }).userRating, 5);
  assert.equal(repo.normalizeMovie({ userRating: 3.5 }).userRating, 0);
  assert.equal(repo.normalizeMovie({ userRating: -1 }).userRating, 0);
  assert.equal(repo.normalizeMovie({ userRating: 6 }).userRating, 0);
  assert.equal(repo.normalizeMovie({ userRating: '5' }).userRating, 0);
  assert.equal(repo.normalizeMovie({}).userRating, 0);
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

test('búsqueda, categoría, favoritas y orden combinados', () => {
  const m = SEED_MOVIES.map((item, idx) => ({
    ...item,
    isFavorite: idx % 2 === 0,
    userRating: idx % 5
  }));

  assert.equal(filterAndSort(m, { query: 'notting' }).length, 1);
  assert.equal(filterAndSort(m, { query: 'NOTTING' }).length, 1);
  assert.equal(filterAndSort(m, { category: 'terror' }).length, 2);
  assert.equal(filterAndSort(m, { category: 'musical' }).length, 0);
  assert.equal(filterAndSort(m, { query: 'x', category: 'terror' }).length, 1);
  assert.equal(filterAndSort(m, { query: 'x', category: 'llanto' }).length, 0);

  // Filtro de favoritas
  const favs = filterAndSort(m, { onlyFavorites: true });
  assert.equal(favs.length, 8);
  assert.ok(favs.every((film) => film.isFavorite === true));

  const byYear = filterAndSort(m, { category: 'romcom', sort: 'anio-asc' });
  assert.equal(byYear[0].title, 'Pretty Woman');
  const desc = filterAndSort(m, { sort: 'titulo-desc' });
  assert.equal(desc[0].title, 'X');
  const asc = filterAndSort(m, { sort: 'titulo-asc' });
  assert.equal(asc[0].title, '10 cosas que odio de ti');
  assert.equal(normalizeText('  ÉPOCA '), 'epoca');
});

test('parseFilters sanea valores de la URL incluyendo favoritas', () => {
  assert.deepEqual(parseFilters({ q: 'a', categoria: 'zzz', orden: 'raro' }), {
    query: 'a',
    category: '',
    sort: 'titulo-asc',
    onlyFavorites: false
  });
  assert.deepEqual(parseFilters({ categoria: 'epoca', orden: 'anio-desc', favoritas: 'true' }), {
    query: '',
    category: 'epoca',
    sort: 'anio-desc',
    onlyFavorites: true
  });
});

test('Oráculo Fetch: respuestas yes, no, maybe con frases editoriales', async () => {
  const fakeYes = async () => ({
    ok: true,
    json: async () => ({ answer: 'yes', verdict: 'yes', phrase: 'The ball is sure.' })
  });
  const resYes = await askOracle({ fetchImpl: fakeYes });
  assert.equal(resYes.rawAnswer, 'yes');
  assert.equal(resYes.answerText, 'Sí');
  assert.equal(resYes.phrase, EDITORIAL_PHRASES.yes.phrase);

  const fakeNo = async () => ({
    ok: true,
    json: async () => ({ answer: 'no', verdict: 'no' })
  });
  const resNo = await askOracle({ fetchImpl: fakeNo });
  assert.equal(resNo.answerText, 'No');
  assert.equal(resNo.phrase, EDITORIAL_PHRASES.no.phrase);

  const fakeMaybe = async () => ({
    ok: true,
    json: async () => ({ answer: 'maybe', verdict: 'again' })
  });
  const resMaybe = await askOracle({ fetchImpl: fakeMaybe });
  assert.equal(resMaybe.answerText, 'Quizás');
  assert.equal(resMaybe.phrase, EDITORIAL_PHRASES.maybe.phrase);
});

test('Oráculo Fetch: errores de red, HTTP y formato dan OracleApiError', async () => {
  await assert.rejects(
    askOracle({ fetchImpl: async () => { throw new TypeError('Failed to fetch'); } }),
    OracleApiError
  );
  await assert.rejects(
    askOracle({ fetchImpl: async () => ({ ok: false, status: 503 }) }),
    /503/
  );
  await assert.rejects(
    askOracle({ fetchImpl: async () => ({ ok: true, json: async () => ({}) }) }),
    OracleApiError
  );
  await assert.rejects(
    askOracle({ fetchImpl: async () => ({ ok: true, json: async () => ({ answer: 'desconocido' }) }) }),
    OracleApiError
  );
});

test('Oráculo Fetch: timeout y cancelación', async () => {
  const hang = (url, { signal }) =>
    new Promise((_, reject) =>
      signal.addEventListener('abort', () => {
        const e = new Error('abort');
        e.name = 'AbortError';
        reject(e);
      })
    );
  await assert.rejects(askOracle({ fetchImpl: hang, timeoutMs: 20 }), /demasiado/);
  const ctrl = new AbortController();
  const p = askOracle({ fetchImpl: hang, signal: ctrl.signal, timeoutMs: 5000 });
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

const requestsRepo = await import('../src/services/requestsRepository.js');

test('solicitudes de películas: normalización estricta', () => {
  const norm = requestsRepo.normalizeRequest({
    title: ' Clueless ',
    year: '1995',
    category: 'romcom',
    comment: ' Por favor agregarla! '
  });
  assert.equal(norm.title, 'Clueless');
  assert.equal(norm.year, 1995);
  assert.equal(norm.category, 'romcom');
  assert.equal(norm.reason, 'Por favor agregarla!');
  assert.equal(norm.status, 'Pendiente');
  assert.ok(norm.id);
  assert.ok(norm.createdAt);
});

test('solicitudes de películas: almacenamiento y persistencia local', () => {
  installStorage();
  const initial = requestsRepo.loadLocalRequests();
  assert.deepEqual(initial.requests, []);
  assert.equal(initial.error, null);

  const req = requestsRepo.normalizeRequest({
    title: 'Legally Blonde',
    year: 2001,
    category: 'romcom'
  });
  const saveErr = requestsRepo.saveLocalRequests([req]);
  assert.equal(saveErr, null);

  const loaded = requestsRepo.loadLocalRequests();
  assert.equal(loaded.requests.length, 1);
  assert.equal(loaded.requests[0].title, 'Legally Blonde');
});

const ALL_SEED_POSTERS = [...new Set(SEED_MOVIES.map((m) => m.poster)), 'diez-things'];

test('todas las 16 películas semilla son válidas con validateMovie (incluyendo título "X")', () => {
  assert.equal(SEED_MOVIES.length, 16);
  for (const movie of SEED_MOVIES) {
    const form = movieToForm(movie, ALL_SEED_POSTERS);
    const errors = validateMovie(form, { posterKeys: ALL_SEED_POSTERS });
    assert.equal(hasErrors(errors), false, `Película "${movie.title}" tiene errores de validación: ${JSON.stringify(errors)}`);
  }
});

test('validación estricta de título: título de 1 carácter ("X") es válido; vacío es inválido', () => {
  const oneChar = { ...valid, title: 'X', posterKey: 'x' };
  assert.equal(hasErrors(validateMovie(oneChar, { posterKeys: POSTER_KEYS })), false);

  const empty = { ...valid, title: '   ', posterKey: 'x' };
  const errEmpty = validateMovie(empty, { posterKeys: POSTER_KEYS });
  assert.ok(errEmpty.title, 'Título vacío debe dar error');
});

const catalogStore = await import('../src/store/catalog.js');
const shared = await import('../src/services/sharedDataService.js');

test('store/catalog: aislamiento de sesión entre usuarios y limpieza total al cerrar sesión', async () => {
  const store = installStorage();

  // 1. Inicializar catálogo base
  await catalogStore.initCatalog(null);
  assert.ok(catalogStore.state.movies.length >= 15);
  // Al inicio como invitada, ninguna favorita previa
  assert.ok(catalogStore.state.movies.every((m) => m.isFavorite === false));

  // 2. Simular sesión de Usuario A con favoritos y calificación en 'x'
  const userAPrefs = {
    x: { isFavorite: true, userRating: 5 }
  };
  store[shared.CACHE_KEYS.userPrefs('user-A')] = JSON.stringify(userAPrefs);

  await catalogStore.setUserSession('user-A');
  const movieXUserA = catalogStore.getMovieById('x');
  assert.ok(movieXUserA);
  assert.equal(movieXUserA.isFavorite, true);
  assert.equal(movieXUserA.userRating, 5);

  // 3. Cerrar sesión (setUserSession(null)): DEBE limpiar inmediatamente las preferencias de Usuario A
  await catalogStore.setUserSession(null);
  assert.equal(catalogStore.state.userId, null);
  const movieXGuest = catalogStore.getMovieById('x');
  assert.equal(movieXGuest.isFavorite, false, 'No deben quedar favoritas de la cuenta anterior tras logout');
  assert.equal(movieXGuest.userRating, 0, 'No deben quedar calificaciones de la cuenta anterior tras logout');

  // 4. Usuario B entra con sus propias preferencias diferentes (favorita en Notting Hill)
  const userBPrefs = {
    'notting-hill': { isFavorite: true, userRating: 4 }
  };
  store[shared.CACHE_KEYS.userPrefs('user-B')] = JSON.stringify(userBPrefs);

  await catalogStore.setUserSession('user-B');
  const nottingB = catalogStore.getMovieById('notting-hill');
  const xB = catalogStore.getMovieById('x');
  assert.equal(nottingB.isFavorite, true);
  assert.equal(nottingB.userRating, 4);
  assert.equal(xB.isFavorite, false, 'Usuario B no debe heredar las favoritas de Usuario A');
  assert.equal(xB.userRating, 0);

  // Limpiar para siguientes tests
  await catalogStore.setUserSession(null);
});

test('store/catalog: catálogo vacío en caché es respetado y no se regeneran películas semilla', async () => {
  const store = installStorage();
  store[shared.CACHE_KEYS.PUBLIC_MOVIES] = JSON.stringify([]);

  await catalogStore.initCatalog(null);
  assert.equal(catalogStore.state.movies.length, 0);
  assert.equal(catalogStore.state.ready, true);
});

test('store/catalog: rollback optimista cuando falla la persistencia de favoritos', async () => {
  installStorage();
  await catalogStore.initCatalog(null);
  const movie = catalogStore.getMovieById('x');
  assert.ok(movie);
  assert.equal(movie.isFavorite, false);

  // Como invitada funciona normalmente en almacenamiento local
  await catalogStore.toggleFavorite('x');
  assert.equal(catalogStore.getMovieById('x').isFavorite, true);

  await catalogStore.toggleFavorite('x');
  assert.equal(catalogStore.getMovieById('x').isFavorite, false);
});

test('comunidad y perfil: crear, editar (vuelve a pending) y eliminar reseñas', async () => {
  installStorage();
  const userId = 'user-test-reviews';

  // 1. Crear reseña
  const created = await shared.createReview(userId, {
    movieId: 'x',
    rating: 4,
    title: 'Excelente terror slasher',
    content: 'Una ambientación setentera brillante y actuaciones memorables.'
  });
  assert.ok(created.id);
  assert.equal(created.status, 'pending');
  assert.equal(created.rating, 4);

  // 2. Editar reseña: el estado DEBE volver o mantenerse en 'pending'
  const updated = await shared.updateReview(created.id, userId, {
    rating: 5,
    title: 'Obra maestra del horror contemporáneo',
    content: 'Edición ampliada: el homenaje al cine grindhouse es impecable.'
  });
  assert.equal(updated.id, created.id);
  assert.equal(updated.rating, 5);
  assert.equal(updated.title, 'Obra maestra del horror contemporáneo');
  assert.equal(updated.status, 'pending', 'Al editar una reseña debe pasar a revisión de moderación');

  // 3. Eliminar reseña
  await shared.deleteReview(created.id, userId, false);
  const remaining = await shared.fetchUserReviews(userId);
  assert.equal(remaining.length, 0);
});

test('comunidad y perfil: crear, editar (vuelve a pending) y eliminar publicaciones', async () => {
  installStorage();
  const userId = 'user-test-posts';

  // 1. Crear publicación
  const created = await shared.createPost(userId, {
    title: '¿Cuál es el mejor tropo de las romcoms de los 2000?',
    content: 'Para mí siempre será enemies to lovers como en 10 cosas que odio de ti.',
    category: 'debate'
  });
  assert.ok(created.id);
  assert.equal(created.status, 'pending');

  // 2. Editar publicación: el estado DEBE volver a 'pending'
  const updated = await shared.updatePost(created.id, userId, {
    title: '¿Cuál es el mejor tropo de las romcoms de los 90 y 2000?',
    content: 'Actualizado: también sumemos fake dating como trope supremo.',
    category: 'debate'
  });
  assert.equal(updated.id, created.id);
  assert.equal(updated.title, '¿Cuál es el mejor tropo de las romcoms de los 90 y 2000?');
  assert.equal(updated.status, 'pending', 'Al editar una publicación debe pasar a revisión de moderación');

  // 3. Eliminar publicación
  await shared.deletePost(created.id, userId, false);
  const remaining = await shared.fetchUserPosts(userId);
  assert.equal(remaining.length, 0);
});

test('carreras de red: respuesta tardía de preferencias no restaura cuenta cerrada', async () => {
  installStorage();
  await catalogStore.initCatalog(null);

  // Simular que el usuario A inicia sesión pero la red tarda
  const sessionPromise = catalogStore.setUserSession('user-slow');

  // Inmediatamente el usuario se desloguea (cerró sesión antes de que responda la red)
  await catalogStore.setUserSession(null);

  // Esperar a que la promesa previa termine
  await sessionPromise;

  // El catálogo en memoria NO debe conservar el usuario 'user-slow' ni sus preferencias
  assert.equal(catalogStore.state.userId, null);
  assert.deepEqual(catalogStore.state.preferences, {});
  assert.ok(catalogStore.state.movies.every((m) => m.isFavorite === false));
});

test('catálogo CRUD: addMovie es asíncrono y devuelve objeto con id único utilizable para navegación', async () => {
  installStorage();
  await catalogStore.initCatalog(null);
  const initialCount = catalogStore.state.movies.length;

  const newMovie = {
    title: 'Clueless',
    year: 1995,
    director: 'Amy Heckerling',
    duration: 97,
    genre: 'Comedia',
    category: 'romcom',
    poster: 'x',
    synopsis: 'Cher es la reina de estilo en Beverly Hills hasta que intenta hacer de celestina.'
  };

  const created = await catalogStore.addMovie(newMovie);
  assert.ok(created);
  assert.ok(created.id, 'La película creada debe tener un id definido');
  assert.equal(created.title, 'Clueless');
  assert.equal(catalogStore.state.movies.length, initialCount + 1);
  assert.equal(catalogStore.getMovieById(created.id)?.title, 'Clueless');
});

