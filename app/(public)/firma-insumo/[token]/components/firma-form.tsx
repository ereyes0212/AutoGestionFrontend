"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MovimientoParaFirma } from "../../../../(protected)/inventario/insumos/types";
import { guardarFirmaMovimiento } from "../actions";

interface FirmaFormProps {
  token: string;
  movimiento: MovimientoParaFirma;
}

/** Resolución interna del canvas: apaisada y con holgura para trazos finos */
const ANCHO_CANVAS = 1400;
const ALTO_CANVAS = 500;

export default function FirmaForm({ token, movimiento }: FirmaFormProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);

  const [abierto, setAbierto] = useState(false);
  const [vertical, setVertical] = useState(false);
  const [tieneTrazo, setTieneTrazo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firmado, setFirmado] = useState(false);

  // Si el teléfono no rota solo, rotamos el lienzo por CSS para firmar apaisado
  useEffect(() => {
    const revisar = () => setVertical(window.innerHeight > window.innerWidth);
    revisar();
    window.addEventListener("resize", revisar);
    window.addEventListener("orientationchange", revisar);
    return () => {
      window.removeEventListener("resize", revisar);
      window.removeEventListener("orientationchange", revisar);
    };
  }, []);

  const abrirPad = async () => {
    setError(null);
    setTieneTrazo(false);
    setAbierto(true);

    // El overlay tiene que existir antes de pedir pantalla completa
    await new Promise((resolve) => requestAnimationFrame(resolve));

    try {
      await overlayRef.current?.requestFullscreen?.();
    } catch {
      // Sin pantalla completa el pad igual ocupa toda la ventana
    }

    try {
      // Solo Android lo soporta; en iOS cae al giro por CSS
      await (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })?.lock?.(
        "landscape"
      );
    } catch {
      // Ignorado a propósito
    }
  };

  const cerrarPad = useCallback(async () => {
    try {
      (screen.orientation as unknown as { unlock?: () => void })?.unlock?.();
    } catch {
      // Ignorado a propósito
    }

    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // Ignorado a propósito
    }

    setAbierto(false);
  }, []);

  const posicion = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    // offsetX/offsetY respetan la rotación CSS del contenedor
    const { offsetX, offsetY } = e.nativeEvent;
    return {
      x: offsetX * (canvas.width / canvas.clientWidth),
      y: offsetY * (canvas.height / canvas.clientHeight),
    };
  };

  const iniciarTrazo = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    canvas.setPointerCapture(e.pointerId);
    dibujando.current = true;

    const { x, y } = posicion(e);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const continuarTrazo = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dibujando.current) return;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const { x, y } = posicion(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!tieneTrazo) setTieneTrazo(true);
  };

  const terminarTrazo = () => {
    dibujando.current = false;
  };

  const limpiar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTieneTrazo(false);
    setError(null);
  };

  /** El lienzo es transparente para que se vea la línea guía; el PNG va con fondo blanco */
  const componerPng = () => {
    const canvas = canvasRef.current!;
    const salida = document.createElement("canvas");
    salida.width = canvas.width;
    salida.height = canvas.height;

    const ctx = salida.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, salida.width, salida.height);
    ctx.drawImage(canvas, 0, 0);

    return salida.toDataURL("image/png");
  };

  const guardar = async () => {
    if (!canvasRef.current) return;

    if (!tieneTrazo) {
      setError("Por favor firme antes de guardar.");
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const resultado = await guardarFirmaMovimiento(token, componerPng());
      if (resultado.success) {
        await cerrarPad();
        setFirmado(true);
      } else {
        setError(resultado.error ?? "No se pudo guardar la firma.");
      }
    } catch {
      setError("No se pudo guardar la firma. Intente nuevamente.");
    } finally {
      setGuardando(false);
    }
  };

  if (firmado) {
    return (
      <div className="space-y-2 py-6 text-center">
        <p className="text-lg font-semibold text-green-700">¡Firma registrada!</p>
        <p className="text-sm text-gray-600">Gracias, ya puede cerrar esta ventana.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={abrirPad}
          className="w-full rounded-md bg-blue-600 px-4 py-4 text-base font-semibold text-white"
        >
          Firmar
        </button>
        <p className="text-center text-xs text-gray-500">
          Se abrirá a pantalla completa. Gire el teléfono para firmar más cómodo.
        </p>
        {error && !abierto && <p className="text-center text-sm text-red-600">{error}</p>}
      </div>

      {abierto && (
        <div ref={overlayRef} className="fixed inset-0 z-50 bg-white">
          <div
            className="absolute flex flex-col bg-white"
            style={
              vertical
                ? {
                    // Giramos el lienzo cuando el teléfono no rota solo (iOS)
                    width: "100vh",
                    height: "100vw",
                    top: 0,
                    left: "100vw",
                    transform: "rotate(90deg)",
                    transformOrigin: "top left",
                  }
                : { width: "100vw", height: "100vh", top: 0, left: 0 }
            }
          >
            <div className="flex items-center justify-between border-b px-4 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {movimiento.cantidadLabel} de {movimiento.insumoNombre}
                </p>
                <p className="truncate text-xs text-gray-500">{movimiento.solicitadoPor}</p>
              </div>
              {error && <p className="ml-3 text-xs text-red-600">{error}</p>}
            </div>

            {/* Área de firma con la línea guía detrás del lienzo */}
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-x-8 bottom-[22%] border-b-2 border-gray-400" />
              <span className="pointer-events-none absolute bottom-[22%] left-8 -translate-y-1 text-2xl text-gray-400">
                ✗
              </span>
              <canvas
                ref={canvasRef}
                width={ANCHO_CANVAS}
                height={ALTO_CANVAS}
                className="absolute inset-0 h-full w-full touch-none"
                onPointerDown={iniciarTrazo}
                onPointerMove={continuarTrazo}
                onPointerUp={terminarTrazo}
                onPointerLeave={terminarTrazo}
                onPointerCancel={terminarTrazo}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 border-t px-4 py-3">
              <button
                type="button"
                onClick={cerrarPad}
                disabled={guardando}
                className="rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={limpiar}
                disabled={guardando}
                className="rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar firma"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
