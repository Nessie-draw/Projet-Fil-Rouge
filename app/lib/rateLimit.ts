// Rate limiter en mémoire — protège les routes sensibles (login)
// Max 5 tentatives par IP toutes les 15 minutes

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS    = 15 * 60 * 1000; // 15 minutes

export function rateLimit(ip: string, max: number = MAX_ATTEMPTS): { ok: boolean; retryAfterSec: number } {
  const now  = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfterSec: 0 };
  }

  if (entry.count >= max) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return { ok: false, retryAfterSec };
  }

  entry.count++;
  return { ok: true, retryAfterSec: 0 };
}

// Réinitialise le compteur après un login réussi
export function resetLimit(ip: string) {
  store.delete(ip);
}

// Nettoyage périodique pour éviter une fuite mémoire sur longue durée
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(ip);
  }
}, WINDOW_MS);
