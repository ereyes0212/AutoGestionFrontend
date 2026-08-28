"use client";

import { useEffect, useRef, useState } from "react";
import { MovimientoParaFirma } from "../../../../(protected)/inventario/insumos/types";
import { guardarFirmaMovimiento } from "../actions";

interface FirmaFormProps {
  token: string;
  movimiento: MovimientoParaFirma;
}

const ANCHO_CANVAS = 600;
const ALTO_CANVAS = 240;

export default function FirmaForm({ token, movimiento }: FirmaFormProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const [tieneTrazo, setTieneTrazo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firmado, setFirmado] = useState(false);

  // Fondo blanco para que la firma no quede transparente en el PNG
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const posicion = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
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
    ctx.lineWidth = 2.5;
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

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setTieneTrazo(false);
    setError(null);
  };

  const guardar = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!tieneTrazo) {
      setError("Por favor dibuje su firma antes de guardar.");
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const resultado = await guardarFirmaMovimiento(token, canvas.toDataURL("image/png"));
      if (resultado.success) {
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
      <div className="text-center space-y-2 py-6">
        <p className="text-lg font-semibold text-green-700">¡Firma registrada!</p>
        <p className="text-sm text-gray-600">
          Gracias, ya puede cerrar esta ventana.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p className="mb-2 text-sm text-gray-600">
          Dibuje su firma dentro del recuadro
        </p>
        <canvas
          ref={canvasRef}
          width={ANCHO_CANVAS}
          height={ALTO_CANVAS}
          className="w-full touch-none rounded border border-gray-300 bg-white"
          onPointerDown={iniciarTrazo}
          onPointerMove={continuarTrazo}
          onPointerUp={terminarTrazo}
          onPointerLeave={terminarTrazo}
          onPointerCancel={terminarTrazo}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
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
          className="rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar firma"}
        </button>
      </div>

      <p className="text-center text-xs text-gray-500">
        Firmando la entrega de {movimiento.cantidadLabel} de {movimiento.insumoNombre}
      </p>
    </div>
  );
}
