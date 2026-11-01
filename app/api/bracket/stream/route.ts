// Server-Sent Events — stream temps réel du bracket vers tous les clients connectés
// Chaque client public s'abonne ici ; quand l'admin sauvegarde, tout le monde
// reçoit la mise à jour instantanément (< 50 ms).

import { bracketEmitter } from "@/app/lib/bracketEvents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // nécessaire pour EventEmitter (pas Edge)

export async function GET() {
  const encoder = new TextEncoder();

  let closed    = false;
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      // Envoyer les mises à jour du bracket dès qu'elles arrivent
      const onUpdate = (data: unknown) => {
        enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };
      bracketEmitter.on("update", onUpdate);

      // Heartbeat toutes les 25 s pour maintenir la connexion ouverte
      // (nginx / proxies coupent les connexions inactives après ~30 s)
      const heartbeat = setInterval(() => {
        enqueue(": ping\n\n");
      }, 25_000);

      cleanup = () => {
        closed = true;
        bracketEmitter.off("update", onUpdate);
        clearInterval(heartbeat);
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no", // désactive le buffering nginx
    },
  });
}
