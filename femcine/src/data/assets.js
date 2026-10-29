// Manifiesto de recursos gráficos. Todas las rutas de imágenes de la aplicación viven acá.
// Los archivos son copias locales (nombres simples) de los originales del repositorio WEB-ROMCOM.
// La tabla de correspondencia está en el README.
import logo from '@/assets/img/logo.png';
import heroBanner from '@/assets/img/hero-banner.png';
import bgNegro from '@/assets/img/bg-negro.png';
import bgRosa from '@/assets/img/bg-rosa.png';
import bgFoto from '@/assets/img/bg-foto.png';
import bgTransicion from '@/assets/img/bg-transicion.png';
import newsletterRecorte from '@/assets/img/newsletter-recorte.png';

import catRomcom from '@/assets/img/categorias/romcom.png';
import catMusical from '@/assets/img/categorias/musical.png';
import catLlanto from '@/assets/img/categorias/llanto.png';
import catEpoca from '@/assets/img/categorias/epoca.png';
import catDistopia from '@/assets/img/categorias/distopia.png';
import catTerror from '@/assets/img/categorias/terror.png';

import elleWoods from '@/assets/img/personajes/elle-woods.png';
import elleWoodsTitle from '@/assets/img/personajes/elle-woods-title.png';
import cherHorowitz from '@/assets/img/personajes/cher-horowitz.png';
import cherHorowitzTitle from '@/assets/img/personajes/cher-horowitz-title.png';
import reginaGeorge from '@/assets/img/personajes/regina-george.png';
import reginaGeorgeTitle from '@/assets/img/personajes/regina-george-title.png';
import veronicaSawyer from '@/assets/img/personajes/veronica-sawyer.png';
import veronicaSawyerTitle from '@/assets/img/personajes/veronica-sawyer-title.png';

import pDiezCosas from '@/assets/img/posters/diez-cosas.png';
import pDiezThings from '@/assets/img/posters/diez-things.png';
import pAnyoneButYou from '@/assets/img/posters/anyone-but-you.png';
import pBottoms from '@/assets/img/posters/bottoms.png';
import pCinderella from '@/assets/img/posters/cinderella-story.png';
import pUglyStepsister from '@/assets/img/posters/ugly-stepsister.png';
import pHowToLose from '@/assets/img/posters/how-to-lose-a-guy.png';
import pJustMyLuck from '@/assets/img/posters/just-my-luck.png';
import pLoveRosie from '@/assets/img/posters/love-rosie.png';
import pMeBeforeYou from '@/assets/img/posters/me-before-you.png';
import pNottingHill from '@/assets/img/posters/notting-hill.png';
import pPrettyWoman from '@/assets/img/posters/pretty-woman.png';
import pPriscilla from '@/assets/img/posters/priscilla.png';
import pShesAllThat from '@/assets/img/posters/shes-all-that.png';
import pShesTheMan from '@/assets/img/posters/shes-the-man.png';
import pTheNotebook from '@/assets/img/posters/the-notebook.png';
import pX from '@/assets/img/posters/x.png';

export const ASSETS = {
  logo,
  heroBanner,
  backgrounds: {
    negro: bgNegro,
    rosa: bgRosa,
    foto: bgFoto,
    transicion: bgTransicion
  },
  newsletterRecorte,
  categories: {
    romcom: catRomcom,
    musical: catMusical,
    llanto: catLlanto,
    epoca: catEpoca,
    distopia: catDistopia,
    terror: catTerror
  },
  characters: [
    {
      id: 'elle-woods',
      name: 'Elle Woods',
      film: 'Legally Blonde',
      portrait: elleWoods,
      title: elleWoodsTitle,
      portraitAlt: 'Elle Woods con anteojos de sol y su perrito dentro de un corazón de encaje fucsia'
    },
    {
      id: 'cher-horowitz',
      name: 'Cher Horowitz',
      film: 'Clueless',
      portrait: cherHorowitz,
      title: cherHorowitzTitle,
      portraitAlt: 'Cher Horowitz dentro de un corazón de encaje fucsia'
    },
    {
      id: 'regina-george',
      name: 'Regina George',
      film: 'Mean Girls',
      portrait: reginaGeorge,
      title: reginaGeorgeTitle,
      portraitAlt: 'Regina George de brazos cruzados dentro de un corazón de encaje fucsia'
    },
    {
      id: 'veronica-sawyer',
      name: 'Veronica Sawyer',
      film: 'Heathers',
      portrait: veronicaSawyer,
      title: veronicaSawyerTitle,
      portraitAlt: 'Veronica Sawyer con campera dentro de un corazón de encaje fucsia'
    }
  ]
};

// Pósters disponibles para elegir en el formulario. La clave es lo que se guarda en LocalStorage.
export const POSTERS = {
  'diez-cosas': { src: pDiezCosas, label: '10 cosas que odio de ti' },
  'diez-things': { src: pDiezThings, label: '10 Things I Hate About You (versión en inglés)' },
  'anyone-but-you': { src: pAnyoneButYou, label: 'Anyone but You' },
  bottoms: { src: pBottoms, label: 'Bottoms' },
  'cinderella-story': { src: pCinderella, label: 'A Cinderella Story' },
  'ugly-stepsister': { src: pUglyStepsister, label: 'The Ugly Stepsister (Den stygge stesøsteren)' },
  'how-to-lose-a-guy': { src: pHowToLose, label: 'How to Lose a Guy in 10 Days' },
  'just-my-luck': { src: pJustMyLuck, label: 'Just My Luck' },
  'love-rosie': { src: pLoveRosie, label: 'Love, Rosie' },
  'me-before-you': { src: pMeBeforeYou, label: 'Me Before You' },
  'notting-hill': { src: pNottingHill, label: 'Notting Hill' },
  'pretty-woman': { src: pPrettyWoman, label: 'Pretty Woman' },
  priscilla: { src: pPriscilla, label: 'Priscilla' },
  'shes-all-that': { src: pShesAllThat, label: "She's All That" },
  'shes-the-man': { src: pShesTheMan, label: "She's the Man" },
  'the-notebook': { src: pTheNotebook, label: 'The Notebook' },
  x: { src: pX, label: 'X' }
};

export const POSTER_OPTIONS = Object.keys(POSTERS).map((key) => ({
  key,
  label: POSTERS[key].label
}));
export const POSTER_KEYS = Object.keys(POSTERS);
