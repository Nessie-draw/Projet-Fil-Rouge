// Cache mémoire du bracket — évite un hit DB à chaque connexion SSE initiale
// TTL : 2 secondes (imperceptible pour l'utilisateur, énorme gain à 300 clients)

type CacheEntry = { data: unknown; ts: number };

const g = globalThis as typeof globalThis & { _bracketCache?: CacheEntry };
const TTL = 2_000; // ms

export function getCached(): unknown | null {
  const c = g._bracketCache;
  if (c && Date.now() - c.ts < TTL) return c.data;
  return null;
}

export function setCached(data: unknown) {
  g._bracketCache = { data, ts: Date.now() };
}

export function invalidateCache() {
  g._bracketCache = undefined;
}
