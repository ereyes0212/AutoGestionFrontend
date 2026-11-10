import { despertarWorker } from "./worker";

/** Se llama una vez al iniciar el servidor (instrumentation.ts). Nunca tumba la app. */
export async function iniciarVideos(): Promise<void> {
  try {
    // Retoma lo que quedó en cola o a medias antes del reinicio.
    despertarWorker();
  } catch (e) {
    console.error("[videos] no se pudo iniciar el worker:", e);
  }
}
