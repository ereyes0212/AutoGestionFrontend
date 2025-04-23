// app/(protected)/configuracion-permisos/[empresaId]/config/page.tsx
import React from "react";
import { ConfigItem } from "../../type";
import DragAndDropConfigurator from "../../components/drag-and-drop";
import { getPuestosActivas } from "@/app/(protected)/puestos/actions";
import { getConfiguracionAprobacionByEmpresaId } from "../../actions";


export default async function ConfiguracionAprobacionPage({ params }: { params: { id: string } }) {

  const empresaId = params.id;
  const configuraciones: ConfigItem[] = await getConfiguracionAprobacionByEmpresaId();
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
