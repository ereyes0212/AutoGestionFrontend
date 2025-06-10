"use client";

import { Activo } from "../types";
import { BarcodeGenerator } from "./BarcodeGenerator";
// ... otros imports ...

export const ActivoForm = ({ activo }: { activo?: Activo }) => {
    // ... lógica del formulario ...

    return (
        <form>
            {/* ... otros campos ... */}

            {activo?.codigoBarra && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Código de Barras
                    </label>
                    <BarcodeGenerator codigoBarra={activo.codigoBarra} />
                </div>
            )}

            {/* ... resto del formulario ... */}
        </form>
    );
}; 