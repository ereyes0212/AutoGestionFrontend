"use client";

import type { NotaTipoRevision } from "../schema";

// Etiquetas y colores de cada tipo de revisión (verde / amarillo / rojo)
export const tipoRevisionMap: Record<NotaTipoRevision, { label: string; color: string; dot: string }> = {
    PUBLICAR_SIN_REVISION: { label: "Publicar sin revisión", color: "bg-green-600 text-white", dot: "bg-green-600" },
    REVISA_EDITOR: { label: "Revisa editor", color: "bg-yellow-400 text-black", dot: "bg-yellow-400" },
    REVISA_JEFE: { label: "Revisa el jefe", color: "bg-red-600 text-white", dot: "bg-red-600" },
};

export const tipoRevisionOptions = Object.entries(tipoRevisionMap) as [NotaTipoRevision, (typeof tipoRevisionMap)[NotaTipoRevision]][];

export const TipoRevisionCell: React.FC<{ tipoRevision?: NotaTipoRevision | null }> = ({ tipoRevision }) => {
    if (!tipoRevision) return <span className="text-sm text-muted-foreground">—</span>;

    const info = tipoRevisionMap[tipoRevision];
    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${info.color}`}>
            {info.label}
        </span>
    );
};
