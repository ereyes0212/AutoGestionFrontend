import { getSession, getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Video } from "lucide-react";
import { listarVideos } from "./actions";
import VideosClient from "./components/videos-client";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const permisos = await getSessionPermisos();
  if (!permisos?.includes("ver_videos")) return <NoAcceso />;

  const [sesion, videos] = await Promise.all([getSession(), listarVideos()]);

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={Video}
        screenName="Videos"
        description="Sube videos y copia el código para insertarlos en las notas de tiempo.hn."
      />
      <VideosClient
        inicial={videos}
        idEmpleado={sesion?.IdEmpleado ?? ""}
        puedeSubir={permisos.includes("subir_videos")}
        puedeEliminar={permisos.includes("eliminar_videos")}
      />
    </div>
  );
}
