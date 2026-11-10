"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Code2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { eliminarVideo, listarVideos, reintentarVideo } from "../actions";
import type { VideoFila } from "../types";
import CodigoVideoDialog from "./codigo-video-dialog";
import { CLASE_ESTADO, ETIQUETA_ESTADO, formatoDuracion, formatoFecha, formatoTamano } from "./formato";
import SubirVideoDialog from "./subir-video-dialog";

type Props = {
  inicial: VideoFila[];
  idEmpleado: string;
  puedeSubir: boolean;
  puedeEliminar: boolean;
};

const INTERVALO_REFRESCO_MS = 4000;

function EstadoBadge({ video }: { video: VideoFila }) {
  return (
    <span
      className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", CLASE_ESTADO[video.estado])}
      title={video.estado === "ERROR" ? (video.errorMensaje ?? undefined) : undefined}
    >
      {ETIQUETA_ESTADO[video.estado]}
    </span>
  );
}

export default function VideosClient({ inicial, idEmpleado, puedeSubir, puedeEliminar }: Props) {
  const { toast } = useToast();
  const [videos, setVideos] = useState<VideoFila[]>(inicial);
  const [filtro, setFiltro] = useState("");
  const [subirAbierto, setSubirAbierto] = useState(false);
  const [videoCodigo, setVideoCodigo] = useState<VideoFila | null>(null);
  const [videoEliminar, setVideoEliminar] = useState<VideoFila | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    try {
      setVideos(await listarVideos());
    } catch (e) {
      console.error("No se pudo refrescar la lista de videos", e);
    }
  }, []);

  // Mientras haya videos convirtiéndose, refresca la lista sola.
  const hayPendientes = videos.some((v) => v.estado === "EN_COLA" || v.estado === "PROCESANDO");
  useEffect(() => {
    if (!hayPendientes) return;
    const t = setTimeout(refrescar, INTERVALO_REFRESCO_MS);
    return () => clearTimeout(t);
  }, [hayPendientes, videos, refrescar]);

  const filtrados = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter((v) => v.titulo.toLowerCase().includes(q) || v.creador.toLowerCase().includes(q));
  }, [videos, filtro]);

  const puedeEliminarVideo = (v: VideoFila) =>
    v.estado !== "PROCESANDO" && (puedeEliminar || (v.creadorEmpleadoId === idEmpleado && v.estado !== "LISTO"));

  async function reintentar(v: VideoFila) {
    setOcupado(v.id);
    const r = await reintentarVideo(v.id);
    setOcupado(null);
    if (!r.ok) toast({ title: "No se pudo reintentar", description: r.error, variant: "destructive" });
    await refrescar();
  }

  async function confirmarEliminar() {
    if (!videoEliminar) return;
    const v = videoEliminar;
    setVideoEliminar(null);
    setOcupado(v.id);
    const r = await eliminarVideo(v.id);
    setOcupado(null);
    if (r.ok) toast({ title: "Video eliminado" });
    else toast({ title: "No se pudo eliminar", description: r.error, variant: "destructive" });
    await refrescar();
  }

  function Acciones({ v }: { v: VideoFila }) {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        {v.estado === "LISTO" && v.codigo && (
          <Button size="sm" onClick={() => setVideoCodigo(v)} className="gap-1">
            <Code2 className="h-4 w-4" /> Código
          </Button>
        )}
        {v.estado === "ERROR" && puedeSubir && (
          <Button size="sm" variant="outline" disabled={ocupado === v.id} onClick={() => reintentar(v)} className="gap-1">
            <RotateCcw className="h-4 w-4" /> Reintentar
          </Button>
        )}
        {puedeEliminarVideo(v) && (
          <Button
            size="sm"
            variant="outline"
            disabled={ocupado === v.id}
            onClick={() => setVideoEliminar(v)}
            aria-label={`Eliminar ${v.titulo}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border p-4">
      <div className="flex flex-col gap-2 pb-4 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar por título o autor"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full md:max-w-sm"
        />
        {puedeSubir && (
          <Button onClick={() => setSubirAbierto(true)} className="w-full gap-2 md:w-auto">
            Subir video <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Escritorio */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Subido por</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length ? (
              filtrados.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="max-w-[320px]">
                    <div className="truncate font-medium" title={v.titulo}>{v.titulo}</div>
                    <div className="truncate text-xs text-muted-foreground" title={v.nombreOriginal}>
                      {v.nombreOriginal} · {formatoTamano(v.tamanoBytes)}
                    </div>
                    {v.estado === "ERROR" && v.errorMensaje && (
                      <div className="mt-1 text-xs text-destructive">{v.errorMensaje}</div>
                    )}
                  </TableCell>
                  <TableCell><EstadoBadge video={v} /></TableCell>
                  <TableCell>{formatoDuracion(v.duracionSeg)}</TableCell>
                  <TableCell>{v.creador}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatoFecha(v.creadoAt)}</TableCell>
                  <TableCell><Acciones v={v} /></TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {videos.length ? "Sin resultados." : "Todavía no hay videos."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Móvil */}
      <div className="grid gap-3 md:hidden">
        {filtrados.length ? (
          filtrados.map((v) => (
            <Card key={v.id}>
              <CardContent className="grid gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="break-words font-medium">{v.titulo}</p>
                  <EstadoBadge video={v} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {v.creador} · {formatoFecha(v.creadoAt)} · {formatoDuracion(v.duracionSeg)}
                </p>
                {v.estado === "ERROR" && v.errorMensaje && <p className="text-xs text-destructive">{v.errorMensaje}</p>}
                <Acciones v={v} />
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {videos.length ? "Sin resultados." : "Todavía no hay videos."}
          </p>
        )}
      </div>

      <SubirVideoDialog abierto={subirAbierto} onOpenChange={setSubirAbierto} onSubido={refrescar} />
      <CodigoVideoDialog video={videoCodigo} onOpenChange={(a) => !a && setVideoCodigo(null)} />

      <AlertDialog open={!!videoEliminar} onOpenChange={(a) => !a && setVideoEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este video?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borra de forma permanente &quot;{videoEliminar?.titulo}&quot;. Las notas donde se haya pegado mostrarán
              &quot;Video no disponible&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarEliminar}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
