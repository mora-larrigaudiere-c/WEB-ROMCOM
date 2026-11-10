// Servicio para consultar el oráculo de la Bola de Cristal (YesNoOracle API).
// Endpoint oficial: https://yesnooracle.app/api/oracle?tool=crystal-ball

export class OracleApiError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = 'OracleApiError';
    this.status = status;
  }
}

export const ORACLE_ENDPOINT = 'https://yesnooracle.app/api/oracle?tool=crystal-ball';

export const EDITORIAL_PHRASES = {
  yes: {
    answer: 'Sí',
    phrase: 'La niebla se disipa en la bola de cristal: el drama te sonríe. Dale play.'
  },
  no: {
    answer: 'No',
    phrase: 'Destello sombrío en el cristal: mejor cambiá de rumbo y buscá otra historia.'
  },
  maybe: {
    answer: 'Quizás',
    phrase: 'El cristal se arremolina en misterio: el destino aún no decide su final.'
  }
};

export async function askOracle({ timeoutMs = 8000, signal = null, fetchImpl = fetch } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const res = await fetchImpl(ORACLE_ENDPOINT, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      throw new OracleApiError(`El servicio del oráculo respondió con error (${res.status}).`, res.status);
    }

    const data = await res.json();
    if (!data || typeof data !== 'object') {
      throw new OracleApiError('La respuesta del oráculo no tiene un formato válido.');
    }

    const rawAnswer = String(data.answer || '').toLowerCase().trim();
    if (!['yes', 'no', 'maybe'].includes(rawAnswer)) {
      throw new OracleApiError('El oráculo devolvió una respuesta no reconocida.');
    }

    const editorial = EDITORIAL_PHRASES[rawAnswer];

    return {
      rawAnswer,
      answerText: editorial.answer,
      phrase: editorial.phrase,
      oraclePhrase: data.phrase || '',
      crystalImage: data.image || 'https://yesnooracle.app/art-crystal.webp',
      tool: data.tool || 'crystal-ball'
    };
  } catch (err) {
    clearTimeout(timer);
    if (timedOut) {
      throw new OracleApiError('La consulta al oráculo tardó demasiado tiempo. Podés reintentar en unos segundos.');
    }
    if (err.name === 'AbortError') {
      throw err;
    }
    if (err instanceof OracleApiError) {
      throw err;
    }
    throw new OracleApiError('No pudimos conectar con el oráculo. Revisá tu conexión a internet.');
  }
}
