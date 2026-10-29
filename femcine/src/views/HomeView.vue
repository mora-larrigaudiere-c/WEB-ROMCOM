<template>
  <div class="home">
    <!-- HERO -->
    <section class="hero" aria-labelledby="hero-title">
      <img class="hero__img" :src="heroBanner" alt="Retrato en blanco y negro de una chica de gesto serio, con borde fucsia y estrellas" width="1280" height="831" />
      <div class="container hero__inner">
        <div class="hero__copy">
          <h1 id="hero-title" class="hero__title">
            I’m <em>just</em> a <em>girl</em> in the <em>world</em>
          </h1>
          <p class="hero__lead">Tu próxima obsesión empieza acá. Descubrí películas e historias inolvidables.</p>
          <router-link class="btn btn--pink" :to="{ name: 'catalogo' }">Explorar películas</router-link>
        </div>
      </div>
    </section>

    <!-- ¿QUIÉN NECESITA LA VIDA REAL? -->
    <section class="intro" aria-labelledby="intro-title">
      <div class="container intro__inner">
        <div class="intro__copy">
          <DisplayTitle id="intro-title" text="¿Quién necesita la vida real?" tone="pink" size="clamp(2rem, 6vw, 4rem)" />
          <p>
            Somos <span class="text-pink">FemCine</span>, tu lugar para escapar del drama real y sumergirte en el drama
            que sí vale la pena: el de las películas. Historias que te rompen el corazón, personajes que son un caos
            (como vos) y un rincón donde ser fan no es un delito. Porque a veces, solo necesitás una buena romcom y cero
            juicios.
          </p>
          <router-link class="link-underline" to="/nosotras">Conocé FemCine</router-link>
        </div>
      </div>
      <div class="film-strip" aria-hidden="true"></div>
    </section>

    <!-- DRAMA SEMANAL -->
    <DramaCarousel :movies="dramaMovies" />

    <!-- ELEGÍ TU VENENO -->
    <section class="veneno" aria-labelledby="veneno-title">
      <div class="veneno__head">
        <div class="container">
          <DisplayTitle id="veneno-title" text="Elegí tu veneno" tone="light" size="clamp(2.8rem, 11vw, 7rem)" class="veneno__title" />
          <p class="veneno__sub">Explorá por categoría editorial.</p>
        </div>
      </div>
      <div class="veneno__body">
        <div class="container">
          <ul class="veneno__grid">
            <CategoryCard v-for="item in categoryCards" :key="item.id" :category="item" :image="item.image" :count="item.count" />
          </ul>
          <router-link class="btn btn--pink veneno__all" :to="{ name: 'catalogo' }">Ver todas las películas</router-link>
        </div>
      </div>
    </section>

    <!-- HALL DE ÍCONOS -->
    <IconHall />

    <!-- NEWSLETTER -->
    <section class="news" aria-labelledby="news-title">
      <img class="news__corner" :src="newsletterCorner" alt="" />
      <div class="container news__inner">
        <DisplayTitle id="news-title" text="Recibí drama directo al inbox" tone="dark" size="clamp(2.2rem, 7vw, 4.6rem)" />
        <NewsletterForm />
      </div>
    </section>
  </div>
</template>

<script>
import DisplayTitle from '@/components/DisplayTitle.vue';
import DramaCarousel from '@/components/DramaCarousel.vue';
import CategoryCard from '@/components/CategoryCard.vue';
import IconHall from '@/components/IconHall.vue';
import NewsletterForm from '@/components/NewsletterForm.vue';
import { state } from '@/store/catalog';
import { ASSETS } from '@/data/assets';
import { CATEGORIES } from '@/data/categories';

export default {
  name: 'HomeView',
  components: { DisplayTitle, DramaCarousel, CategoryCard, IconHall, NewsletterForm },
  data() {
    return {
      state,
      heroBanner: ASSETS.heroBanner,
      newsletterCorner: ASSETS.newsletterRecorte
    };
  },
  computed: {
    // "Drama semanal" se alimenta del catálogo guardado: las primeras películas registradas.
    dramaMovies() {
      return this.state.movies.slice(0, 6);
    },
    // Las seis categorías con su gráfico original y cuántas películas tiene cada una.
    categoryCards() {
      return CATEGORIES.map((category) => ({
        ...category,
        image: ASSETS.categories[category.id],
        count: this.state.movies.filter((movie) => movie.category === category.id).length
      }));
    }
  }
};
</script>

<style scoped>
/* HERO */
.hero { position: relative; background: #0a0a0a var(--img-negro) center / cover; overflow: hidden; }
.hero__img { display: block; width: 100%; height: auto; }
.hero__inner { order: -1; }
.hero { display: flex; flex-direction: column; }
.hero__copy { padding-block: 28px 8px; display: grid; gap: 16px; justify-items: start; }
.hero__title {
  margin: 0; font-family: var(--font-display); font-weight: 800; text-transform: uppercase;
  font-size: clamp(2.6rem, 12vw, 4.6rem); line-height: 0.98; letter-spacing: -0.005em;
}
.hero__title em { font-family: var(--font-script); font-style: normal; font-weight: 400; text-transform: none; font-size: 1.25em; line-height: 0.8; }
.hero__lead { margin: 0; font-size: 1.125rem; max-width: 34ch; }

/* INTRO */
.intro { position: relative; background: #0a0a0a var(--img-negro) center / cover; padding-top: clamp(32px, 6vw, 72px); }
.intro__inner { padding-bottom: 36px; }
.intro__copy { max-width: 62ch; display: grid; gap: 18px; justify-items: start; }
.intro__copy p { margin: 0; }
.film-strip {
  aspect-ratio: 1280 / 126; width: 100%;
  background: var(--img-transicion) 0 42.7% / 100% auto no-repeat;
}

/* VENENO */
.veneno__head { border-top: 4px solid var(--black); background: var(--pink-strong) var(--img-rosa) center / cover; padding-block: clamp(36px, 7vw, 88px); }
.veneno__title { -webkit-text-stroke: 1.5px var(--black); paint-order: stroke fill; }
.veneno__sub { margin: 12px 0 0; font-size: 1.2rem; font-weight: 700; color: var(--black); }
.veneno__body { background: #0a0a0a var(--img-negro) center / cover; padding-block: clamp(32px, 6vw, 72px); }
.veneno__grid { list-style: none; margin: 0 0 32px; padding: 0; display: grid; gap: 18px 14px; grid-template-columns: repeat(2, 1fr); }
.veneno__all { width: 100%; }

/* NEWSLETTER */
.news { position: relative; overflow: hidden; background: var(--pink-strong) var(--img-rosa) center / cover; color: var(--black); padding-block: clamp(36px, 6vw, 80px); }
.news__corner { display: block; width: min(100%, 560px); height: auto; margin: -8px 0 8px auto; position: relative; }
.news__inner { display: grid; gap: 24px; position: relative; }

@media (min-width: 768px) {
  .veneno__grid { grid-template-columns: repeat(3, 1fr); }
  .veneno__all { width: auto; }
  .intro { background: #0a0a0a var(--img-transicion) 0 0 / 100% auto no-repeat; padding-top: 0; }
  .intro__inner { display: grid; align-items: center; min-height: calc(100vw * 0.36); padding-block: 40px; }
  .intro__copy { margin-left: clamp(0px, 28vw, 380px); }
  .film-strip { display: none; }
  .intro { min-height: calc(100vw * 0.505); display: flex; flex-direction: column; justify-content: center; }
}

@media (min-width: 1000px) {
  /* Hero amplio: texto a la izquierda y banner a todo el ancho, como en la composición original. */
  .hero { display: block; min-height: min(78vh, 760px); }
  .hero__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: right center; }
  .hero__inner { position: relative; z-index: 1; display: flex; align-items: center; min-height: min(78vh, 760px); }
  .hero__copy { width: 46%; justify-items: end; text-align: right; padding-block: 48px; }
  .hero__lead { text-align: right; }
  .veneno__grid { grid-template-columns: repeat(6, 1fr); gap: 20px; }
  .news__corner { position: absolute; top: -10px; right: 0; width: min(46vw, 620px); margin: 0; }
  .news__inner { grid-template-columns: 1fr 1fr; align-items: end; min-height: 320px; padding-top: 140px; }
}
</style>
