import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Real PostgreSQL SQL/RLS execution in memory. Supabase Auth is represented by
// its user table and auth.uid() contract, not by real Google tokens or accounts.
const db = new PGlite();
await db.exec(`
  CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  GRANT USAGE ON SCHEMA auth TO anon, authenticated;
  GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
`);
let schema = await readFile(process.argv[2], 'utf8');
// gen_random_uuid() is built into PostgreSQL; PGlite lacks the optional pgcrypto
// extension bundle. This is the only adaptation to the production schema.
schema = schema.replace(/CREATE EXTENSION IF NOT EXISTS "?pgcrypto"?\s*;/gi, '');
await db.exec(schema);
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const ADMIN = '33333333-3333-4333-8333-333333333333';
await db.query(`INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
  ($1,'a@example.invalid','{"full_name":"Usuaria A"}'),
  ($2,'b@example.invalid','{"full_name":"Usuaria B"}'),
  ($3,'admin@example.invalid','{"full_name":"Administradora"}')`, [A,B,ADMIN]);
await db.query("INSERT INTO public.admin_roles(user_id,role) VALUES ($1,'admin')",[ADMIN]);
let passed = 0, failed = 0;
async function check(name, fn) {
  await db.exec('RESET ROLE');
  await db.query("SELECT set_config('request.jwt.claim.sub','',false)");
  try { await fn(); console.log(`PASS ${name}`); passed++; }
  catch (e) { console.log(`FAIL ${name}: ${e.message}`); failed++; }
}
async function as(role, uid = '') {
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[uid]);
  await db.exec(`SET ROLE ${role}`);
}
async function denied(sql, args=[]) {
  await assert.rejects(db.query(sql,args), /permission denied|row-level security|policy|not allowed/i);
}
await check('catalogo publico contiene 16 peliculas',async()=>{
  await as('anon');
  assert.equal((await db.query('SELECT count(*)::int n FROM public.movies')).rows[0].n,16);
});
await check('perfil publico sin acceso a email',async()=>{
  await as('anon');
  assert.ok((await db.query('SELECT id,display_name,avatar_url FROM public.profiles')).rows.length>=3);
  await denied('SELECT email FROM public.profiles');
});
await check('usuario normal no administra catalogo',async()=>{
  await as('authenticated',A);
  await denied("INSERT INTO public.movies(id,title,year,director,duration,genre,category,poster,synopsis) VALUES ('intruso','Intruso',2000,'Director',90,'Drama','llanto','x','Una sinopsis de prueba con longitud suficiente.')");
});
await check('usuario no puede autoasignarse admin',async()=>{
  await as('authenticated',A);
  await denied("INSERT INTO public.admin_roles(user_id,role) VALUES ($1,'admin')",[A]);
});
await check('preferencias aisladas entre cuentas',async()=>{
  await as('authenticated',A);
  await db.query("INSERT INTO public.movie_preferences(user_id,movie_id,is_favorite,user_rating) VALUES ($1,'x',true,4)",[A]);
  await db.exec('RESET ROLE');
  await as('authenticated',B);
  assert.equal((await db.query('SELECT * FROM public.movie_preferences')).rows.length,0);
  await denied("INSERT INTO public.movie_preferences(user_id,movie_id,is_favorite) VALUES ($1,'x',true)",[A]);
});
await check('post pendiente no visible a visitantes ni otra cuenta',async()=>{
  await as('authenticated',A);
  const {rows}=await db.query("INSERT INTO public.posts(user_id,title,content,status) VALUES ($1,'Mi publicacion','Contenido de prueba con mas de veinte caracteres.','pending') RETURNING id",[A]);
  assert.equal(rows.length,1);
  await db.exec('RESET ROLE'); await as('anon');
  assert.equal((await db.query('SELECT * FROM public.posts')).rows.length,0);
  await db.exec('RESET ROLE'); await as('authenticated',B);
  assert.equal((await db.query('SELECT * FROM public.posts')).rows.length,0);
});
await check('autor no puede publicar sin moderacion',async()=>{
  await as('authenticated',A);
  await denied("UPDATE public.posts SET status='approved' WHERE user_id=$1",[A]);
});
await check('admin aprueba y publico puede leer',async()=>{
  await as('authenticated',ADMIN);
  const {rows}=await db.query("UPDATE public.posts SET status='approved',moderated_by=$1 WHERE user_id=$2 RETURNING id",[ADMIN,A]);
  assert.equal(rows.length,1);
  await db.exec('RESET ROLE'); await as('anon');
  assert.equal((await db.query('SELECT * FROM public.posts')).rows.length,1);
});
await check('edicion del autor requiere nueva moderacion',async()=>{
  await as('authenticated',A);
  await db.query("UPDATE public.posts SET content='Texto editado con mas de veinte caracteres.',status='pending' WHERE user_id=$1",[A]);
  await db.exec('RESET ROLE'); await as('anon');
  assert.equal((await db.query('SELECT * FROM public.posts')).rows.length,0);
});
await check('resena pendiente y aprobacion protegida',async()=>{
  await as('authenticated',A);
  await db.query("INSERT INTO public.reviews(movie_id,user_id,rating,content,status) VALUES ('x',$1,4,'Una resena suficientemente detallada.','pending')",[A]);
  await denied("UPDATE public.reviews SET status='approved' WHERE user_id=$1",[A]);
  await db.exec('RESET ROLE'); await as('anon');
  assert.equal((await db.query('SELECT * FROM public.reviews')).rows.length,0);
});
await check('relaciones PostgREST con perfiles existentes',async()=>{
  const {rows}=await db.query("SELECT conrelid::regclass::text t FROM pg_constraint WHERE contype='f' AND confrelid='public.profiles'::regclass AND conrelid IN ('public.reviews'::regclass,'public.posts'::regclass)");
  assert.equal(new Set(rows.map(r=>r.t)).size,2);
});
await check('repetir esquema preserva cambios del catalogo',async()=>{
  await db.query("UPDATE public.movies SET title='Titulo editado por admin' WHERE id='x'");
  await db.exec(schema);
  assert.equal((await db.query("SELECT title FROM public.movies WHERE id='x'")).rows[0].title,'Titulo editado por admin');
});
console.log(JSON.stringify({passed,failed,environment:'PGlite PostgreSQL con contrato Auth simulado; no prueba Google/Supabase en vivo'}));
await db.close();
process.exitCode = failed ? 1 : 0;
