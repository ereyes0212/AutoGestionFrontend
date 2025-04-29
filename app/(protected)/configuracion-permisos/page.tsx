
import { getPuestosActivas } from "@/app/(protected)/puestos/actions";
import { getConfiguracionAprobacion } from "./actions";
import DragAndDropConfigurator from "./components/drag-and-drop";
import { ConfigItem } from "./type";


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
