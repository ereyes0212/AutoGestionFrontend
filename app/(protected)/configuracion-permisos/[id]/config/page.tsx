// app/(protected)/configuracion-permisos/[empresaId]/config/page.tsx
import React from "react";
import { ConfigItem } from "../../type";
import { getConfiguracionAprobacionByEmpresaId } from "../../actions";
import DragAndDropConfigurator from "../../components/drag-and-drop";
import { getPuestosActivas } from "@/app/(protected)/puestos/actions";

interface PageProps {
  params: {
    empresaId: string;
  };
}

export default async function ConfiguracionAprobacionPage({ params }: { params: { id: string } }) {

  const empresaId = params.id;
  const configuraciones: ConfigItem[] = await getConfiguracionAprobacionByEmpresaId(empresaId);
  const puestos = await getPuestosActivas()
  const puestoId = "18f438ba-fcb2-4903-96af-712677ce7fbb";

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Configurar Orden de Aprobación</h1>
      <DragAndDropConfigurator
        puestos={puestos}
        initialItems={configuraciones}
        empresaId={empresaId}
        puestoId={puestoId}
      />
    </div>
  );
}
