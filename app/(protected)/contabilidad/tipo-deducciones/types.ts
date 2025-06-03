// types/ajuste-tipo.ts
export type AjusteCategoria = "DEDUCCION" | "BONO";

export interface AjusteTipo {
  id?: string;                   // UUID de base de datos
  nombre: string;                // Nombre del ajuste (p.ej. "Seguro Social", "Bono Asistencia")
  descripcion: string;           // Descripción
  categoria: AjusteCategoria;    // "DEDUCCION" o "BONO"
  montoPorDefecto: number;       // Ej: 100.00
  activo?: boolean;              // Verdadero si está disponible
}
