// Singleton EventEmitter partagé entre les routes API (même process Node.js)
// Permet au POST /api/bracket de notifier instantanément tous les clients SSE connectés.

import { EventEmitter } from "events";

const g = globalThis as typeof globalThis & { _bracketEmitter?: EventEmitter };

if (!g._bracketEmitter) {
  g._bracketEmitter = new EventEmitter();
  g._bracketEmitter.setMaxListeners(600); // supporte 300+ clients + marge
}

export const bracketEmitter = g._bracketEmitter;
