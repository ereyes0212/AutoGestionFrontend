// Next.js lo ejecuta una vez al iniciar el servidor.
// El import va DENTRO del if para que webpack lo descarte en el build del runtime edge
// (ahí no existen child_process, fs, etc.).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { iniciarVideos } = await import("./lib/videos/arranque");
    await iniciarVideos();
  }
}
