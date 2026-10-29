// Películas de ejemplo. Solo se cargan cuando NO existe un catálogo guardado en LocalStorage.
// "poster" es una clave del manifiesto de recursos (src/data/assets.js) o una URL http(s).
// Los datos de ficha (director, duración, año) son de referencia académica: conviene revisarlos.
export const SEED_MOVIES = [
  {
    id: 'diez-cosas-que-odio-de-ti',
    title: '10 cosas que odio de ti',
    year: 1999,
    director: 'Gil Junger',
    duration: 97,
    genre: 'Comedia romántica',
    category: 'romcom',
    poster: 'diez-cosas',
    synopsis:
      'Cuando Bianca no puede salir con nadie hasta que su hermana mayor lo haga, un chico de la escuela organiza una cita muy poco inocente para la temida Kat Stratford.'
  },
  {
    id: 'anyone-but-you',
    title: 'Anyone but You',
    year: 2023,
    director: 'Will Gluck',
    duration: 103,
    genre: 'Comedia romántica',
    category: 'romcom',
    poster: 'anyone-but-you',
    synopsis:
      'Bea y Ben tienen una primera cita perfecta y un final desastroso. Meses después coinciden en una boda en Australia y fingen ser pareja para sobrevivir al fin de semana.'
  },
  {
    id: 'bottoms',
    title: 'Bottoms',
    year: 2023,
    director: 'Emma Seligman',
    duration: 92,
    genre: 'Comedia',
    category: 'romcom',
    poster: 'bottoms',
    synopsis:
      'Dos amigas impopulares fundan un club de pelea en su secundaria para acercarse a las chicas que les gustan, y el plan se les va de las manos.'
  },
  {
    id: 'a-cinderella-story',
    title: 'A Cinderella Story',
    year: 2004,
    director: 'Mark Rosman',
    duration: 95,
    genre: 'Comedia romántica',
    category: 'romcom',
    poster: 'cinderella-story',
    synopsis:
      'Sam trabaja sin descanso para su madrastra y chatea cada noche con un desconocido. Lo que no sabe es que ese chico es el más popular de su escuela.'
  },
  {
    id: 'the-ugly-stepsister',
    title: 'The Ugly Stepsister',
    year: 2025,
    director: 'Emilie Blichfeldt',
    duration: 109,
    genre: 'Terror y comedia',
    category: 'terror',
    poster: 'ugly-stepsister',
    synopsis:
      'Una relectura sangrienta de Cenicienta desde el lado de la hermanastra, dispuesta a todo para encajar en los estándares de belleza de la corte.'
  },
  {
    id: 'how-to-lose-a-guy-in-10-days',
    title: 'How to Lose a Guy in 10 Days',
    year: 2003,
    director: 'Donald Petrie',
    duration: 116,
    genre: 'Comedia romántica',
    category: 'romcom',
    poster: 'how-to-lose-a-guy',
    synopsis:
      'Una periodista debe espantar a un hombre en diez días para su nota. Él, por una apuesta, debe lograr que ella se enamore en el mismo plazo.'
  },
  {
    id: 'just-my-luck',
    title: 'Just My Luck',
    year: 2006,
    director: 'Donald Petrie',
    duration: 103,
    genre: 'Comedia romántica',
    category: 'romcom',
    poster: 'just-my-luck',
    synopsis:
      'Ashley tiene una suerte envidiable hasta que un beso intercambia su buena fortuna con la de un chico que siempre atrae los problemas.'
  },
  {
    id: 'love-rosie',
    title: 'Love, Rosie',
    year: 2014,
    director: 'Christian Ditter',
    duration: 102,
    genre: 'Comedia romántica',
    category: 'llanto',
    poster: 'love-rosie',
    synopsis:
      'Rosie y Alex son mejores amigos desde la infancia. Entre malentendidos, distancias y mala sincronía, tardan años en admitir lo que sienten.'
  },
  {
    id: 'me-before-you',
    title: 'Me Before You',
    year: 2016,
    director: 'Thea Sharrock',
    duration: 106,
    genre: 'Drama romántico',
    category: 'llanto',
    poster: 'me-before-you',
    synopsis:
      'Louisa consigue trabajo como cuidadora de Will, un joven que quedó tetrapléjico. Entre ambos nace un vínculo que cambia la forma en que los dos ven la vida.'
  },
  {
    id: 'notting-hill',
    title: 'Notting Hill',
    year: 1999,
    director: 'Roger Michell',
    duration: 124,
    genre: 'Comedia romántica',
    category: 'romcom',
    poster: 'notting-hill',
    synopsis:
      'Un librero londinense común y corriente se cruza con la actriz más famosa del mundo. Descubrir si el amor puede sobrevivir a la fama es la parte difícil.'
  },
  {
    id: 'pretty-woman',
    title: 'Pretty Woman',
    year: 1990,
    director: 'Garry Marshall',
    duration: 119,
    genre: 'Comedia romántica',
    category: 'romcom',
    poster: 'pretty-woman',
    synopsis:
      'Un empresario contrata a Vivian para que lo acompañe durante una semana. Lo que empieza como un trato termina por volverse algo mucho más complicado.'
  },
  {
    id: 'priscilla',
    title: 'Priscilla',
    year: 2023,
    director: 'Sofia Coppola',
    duration: 113,
    genre: 'Drama biográfico',
    category: 'epoca',
    poster: 'priscilla',
    synopsis:
      'La historia de Priscilla Presley, desde su adolescencia hasta su vida en Graceland junto a Elvis, contada desde su propia mirada.'
  },
  {
    id: 'shes-all-that',
    title: "She's All That",
    year: 1999,
    director: 'Robert Iscove',
    duration: 95,
    genre: 'Comedia romántica',
    category: 'romcom',
    poster: 'shes-all-that',
    synopsis:
      'Tras una ruptura, el chico más popular apuesta que puede transformar a cualquier compañera en la reina del baile. Elige a Laney, la artista solitaria.'
  },
  {
    id: 'shes-the-man',
    title: "She's the Man",
    year: 2006,
    director: 'Andy Fickman',
    duration: 105,
    genre: 'Comedia romántica',
    category: 'romcom',
    poster: 'shes-the-man',
    synopsis:
      'Cuando cancelan el equipo femenino de fútbol, Viola se hace pasar por su hermano gemelo para jugar en otro colegio y termina enredada en un lío amoroso.'
  },
  {
    id: 'the-notebook',
    title: 'The Notebook',
    year: 2004,
    director: 'Nick Cassavetes',
    duration: 123,
    genre: 'Drama romántico',
    category: 'llanto',
    poster: 'the-notebook',
    synopsis:
      'Un hombre mayor lee a una mujer la historia de dos jóvenes de clases sociales distintas que se enamoraron en un verano en el sur de Estados Unidos.'
  },
  {
    id: 'x',
    title: 'X',
    year: 2022,
    director: 'Ti West',
    duration: 105,
    genre: 'Terror',
    category: 'terror',
    poster: 'x',
    synopsis:
      'Un equipo de rodaje alquila una granja aislada en Texas para filmar una película para adultos, sin saber que sus dueños mayores los vigilan.'
  }
];
