import { getMovimientoParaFirma } from "./actions";
import FirmaForm from "./components/firma-form";

export const dynamic = "force-dynamic";

function Mensaje({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div className="text-center space-y-2 py-6">
      <p className="text-lg font-semibold text-gray-900">{titulo}</p>
      <p className="text-sm text-gray-600">{detalle}</p>
    </div>
  );
}

export default async function FirmaInsumoPage({ params }: { params: { token: string } }) {
  const movimiento = await getMovimientoParaFirma(params.token);

  return (
    <div className="w-full max-w-xl p-4">
      <div className="rounded-xl bg-white p-6 text-gray-900 shadow-lg">
        <h1 className="text-xl font-bold">Firma de entrega de insumo</h1>

        {!movimiento && (
          <Mensaje
            titulo="Enlace no válido"
            detalle="El enlace de firma no existe o ya fue utilizado."
          />
        )}

        {movimiento && (
          <>
            <dl className="mt-4 space-y-2 rounded-lg border border-gray-200 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Insumo</dt>
                <dd className="font-medium text-right">{movimiento.insumoNombre}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Cantidad</dt>
                <dd className="font-medium text-right">{movimiento.cantidadLabel}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Ciudad</dt>
                <dd className="font-medium text-right">{movimiento.ciudadNombre}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Solicitado por</dt>
                <dd className="font-medium text-right">{movimiento.solicitadoPor}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Registrado por</dt>
                <dd className="font-medium text-right">{movimiento.registradoPor}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Fecha</dt>
                <dd className="font-medium text-right">{movimiento.fechaLabel}</dd>
              </div>
              {movimiento.observaciones && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Observaciones</dt>
                  <dd className="font-medium text-right">{movimiento.observaciones}</dd>
                </div>
              )}
            </dl>

            {movimiento.estado === "FIRMADO" && (
              <Mensaje
                titulo="Este movimiento ya fue firmado"
                detalle="No es necesario volver a firmar."
              />
            )}

            {movimiento.estado === "EXPIRADO" && (
              <Mensaje
                titulo="El enlace expiró"
                detalle="Solicite al encargado de inventario que genere un nuevo enlace de firma."
              />
            )}

            {movimiento.estado === "PENDIENTE" && (
              <div className="mt-4">
                <FirmaForm token={params.token} movimiento={movimiento} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
