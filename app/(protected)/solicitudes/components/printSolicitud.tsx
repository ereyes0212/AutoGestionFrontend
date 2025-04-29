'use client'

import { useEffect } from "react";
import { SolicitudPermiso } from "../type";

export default function ClientPrintView({ solicitud }: { solicitud: SolicitudPermiso }) {
  useEffect(() => {
    window.print()
  }, [])

  return (
    <div className="print-container">
      <h1>Solicitud #{solicitud.id}</h1>
      <p>Nombre: {solicitud.nombreEmpleado}</p>
      <p>Fecha: {solicitud.fechaSolicitud}</p>
      {/* más campos aquí */}
    </div>
  )
}
