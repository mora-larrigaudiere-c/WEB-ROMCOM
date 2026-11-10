import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(process.argv[2]);
const defer=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const flush=()=>new Promise(r=>setTimeout(r,20));
async function load(file,mocks){
  let src=await readFile(path.join(root,file),'utf8');
  if(file.endsWith('.vue')) src=src.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
  const context=vm.createContext({console:{warn(){},error(){},log(){}},setTimeout,clearTimeout,URL,AbortController});
  const requested=new Map();
  for(const match of src.matchAll(/import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"];?/g)){
    const names=[];
    const clause=match[1].trim();
    if(!clause.startsWith('{') && !clause.startsWith('*')) names.push('default');
    const named=clause.match(/\{([\s\S]*?)\}/);
    if(named) for(const item of named[1].split(',')) if(item.trim())names.push(item.trim().split(/\s+as\s+/)[0]);
    requested.set(match[2],names);
  }
  const mod=new vm.SourceTextModule(src,{context,identifier:file});
  await mod.link(spec=>{
    const alias=spec.replace(/^\.\.\//,'@/').replace(/\.js$/,'');
    const values=mocks[spec]||mocks[alias]||{};
    const names=requested.get(spec)||Object.keys(values);
    return new vm.SyntheticModule(names,function(){for(const name of names)this.setExport(name,values[name]??{});},{context});
  });
  await mod.evaluate(); return mod.namespace;
}
let passed=0,failed=0;
async function check(name,fn){try{await fn();console.log(`PASS ${name}`);passed++;}catch(e){console.log(`FAIL ${name}: ${e.message}`);failed++;}}
const movie={id:'x',title:'X',isFavorite:false,userRating:0};
function catalogMocks({preferences=async()=>({}),publicMovies=async()=>[{...movie}]}={}){
  return {
    vue:{reactive:x=>x},
    '@/services/movieRepository':{loadMovies:()=>({movies:[{...movie}],error:null}),saveMovies:()=>null,createId:()=> 'new',normalizeMovie:x=>x},
    '@/services/sharedDataService':{fetchPublicMovies:publicMovies,fetchUserPreferences:preferences,upsertUserPreference:async()=>{},insertAdminMovie:async x=>x,updateAdminMovie:async(id,x)=>x,deleteAdminMovie:async()=>{}},
    '@/services/supabaseClient':{isSupabaseConfigured:true}
  };
}
await check('salir de cuenta elimina preferencias privadas',async()=>{
  const m=await load('src/store/catalog.js',catalogMocks({preferences:async()=>({x:{isFavorite:true,userRating:5}})}));
  await m.initCatalog(); await m.setUserSession('A'); await m.setUserSession(null);
  assert.equal(m.state.movies[0].isFavorite,false);
  assert.equal(m.state.movies[0].userRating,0);
});
await check('respuesta tardia de preferencias no restaura cuenta cerrada',async()=>{
  const pending=defer();
  const m=await load('src/store/catalog.js',catalogMocks({preferences:()=>pending.promise}));
  await m.initCatalog(); const switching=m.setUserSession('A'); await m.setUserSession(null);
  pending.resolve({x:{isFavorite:true,userRating:5}}); await switching; await flush();
  assert.equal(m.state.userId,null);assert.equal(m.state.movies[0].isFavorite,false);
});
await check('catalogo remoto vacio no repone ejemplos',async()=>{
  const m=await load('src/store/catalog.js',catalogMocks({publicMovies:async()=>[]}));
  await m.initCatalog(); assert.equal(m.state.movies.length,0);
});
await check('escritura en cola de cuenta A no se ejecuta como cuenta B',async()=>{
  const pending=defer();const writes=[];
  const mocks=catalogMocks();
  mocks['@/services/sharedDataService'].upsertUserPreference=(uid,id,pref)=>{
    writes.push({uid,id,pref});return writes.length===1?pending.promise:Promise.resolve();
  };
  const m=await load('src/store/catalog.js',mocks);
  await m.initCatalog();await m.setUserSession('A');
  const first=m.toggleFavorite('x');await flush();
  const queued=m.toggleFavorite('x');
  await m.setUserSession('B');pending.resolve();await Promise.all([first,queued]);
  assert.equal(writes.some(w=>w.uid==='B'),false,'una accion de A fue guardada en la cuenta B');
});
await check('callback Auth no devuelve Promise y descarta rol obsoleto',async()=>{
  let listener; const role=defer();
  const m=await load('src/store/auth.js',{
    vue:{reactive:x=>x},
    '@/services/supabaseClient':{isSupabaseConfigured:true,getCurrentSession:async()=>null,onAuthStateChange:cb=>{listener=cb;return {data:{subscription:{unsubscribe(){}}}};},signInWithGoogle:async()=>{},signOut:async()=>{}},
    '@/services/sharedDataService':{checkAdminRole:()=>role.promise,fetchProfile:async()=>({display_name:'A'})}
  });
  await m.initAuth(); assert.equal(typeof listener,'function');
  const returned=listener('SIGNED_IN',{user:{id:'A'}});
  const asyncCallback=!!returned && typeof returned.then==='function';
  await flush(); listener('SIGNED_OUT',null); role.resolve(true); await flush();
  assert.equal(m.authState.user,null);assert.equal(m.authState.isAdmin,false,'rol anterior restaurado despues de salir');
  assert.equal(asyncCallback,false,'callback Supabase async puede bloquear llamadas Auth');
});
await check('alta espera confirmacion antes de navegar al detalle',async()=>{
  const saved=defer(); const navigation=[];
  const m=await load('src/views/MovieFormView.vue',{
    '@/store/catalog':{state:{ready:true},addMovie:()=>saved.promise,updateMovie:()=>saved.promise,getMovieById:()=>null},
    '@/store/auth':{authState:{user:{id:'admin'},isAdmin:true,loading:false}},
    '@/services/supabaseClient':{isSupabaseConfigured:true}
  });
  const component=m.default;
  const ctx={...component.data?.(),isEdit:false,canManage:true,canEdit:true,isAllowed:true,authState:{user:{id:'admin'},isAdmin:true,loading:false},$router:{push:x=>navigation.push(x)},$route:{params:{}},movie:null};
  Object.assign(ctx,component.methods);
  const pending=component.methods.save.call(ctx,{title:'Nueva'});
  const early=navigation.length;
  saved.resolve({id:'new'});await pending;
  assert.equal(early,0,'navego antes de resolver addMovie');
  assert.equal(navigation.length,1); assert.equal(navigation[0].params.id,'new');
});
console.log(JSON.stringify({passed,failed,scope:'codigo real con servicios de red simulados y respuestas diferidas'}));
process.exitCode=failed?1:0;
