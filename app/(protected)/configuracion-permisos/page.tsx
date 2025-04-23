// app/(protected)/configuracion-permisos/[empresaId]/config/page.tsx
import React from "react";
import { getPuestosActivas } from "@/app/(protected)/puestos/actions";
import { getConfiguracionAprobacion } from "./actions";
import { ConfigItem } from "./type";
import DragAndDropConfigurator from "./components/drag-and-drop";


export default async function ConfiacionAprobacionPage() {

  const configuraciones: ConfigItem[] = await getConfiguracionAprobacion();
  const puestos = await getPuestosActivas()

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Configurar Orden de Aprobación</h1>
      <DragAndDropConfigurator
        puestos={puestos}
        initialItems={configuraciones}
      />
    </div>
  );
}
