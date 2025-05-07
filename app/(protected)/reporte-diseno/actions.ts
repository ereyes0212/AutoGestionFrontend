"use server";

import apiService from "../../../lib/server";
import { ReporteDisenoDTOSchema } from "./schema";
import { ReporteDiseño } from "./type";

/**
 * Obtiene todos los reportes de diseño.
 */
export async function getReportesDiseño(): Promise<ReporteDiseño[]> {
  try {
    const response = await apiService.get<ReporteDiseño[]>('/ReporteDiseño');
    return response.data;
  } catch (error) {
    console.error('Error al obtener los reportes de diseño:', error);
    return [];
  }
}

/**
 * Obtiene un reporte de diseño por ID.
 */
export async function getReporteDiseñoById(
  id: string
): Promise<ReporteDiseño | null> {
  try {
    const response = await apiService.get<ReporteDiseño>(`/ReporteDiseño/${id}`);
    return response.data || null;
  } catch (error) {
    console.error(`Error al obtener el reporte de diseño ${id}:`, error);
    return null;
  }
}

/**
 * Crea un nuevo reporte de diseño.
 */
export async function postReporteDiseño(
  { reporte }: { reporte: unknown }
): Promise<ReporteDiseño> {
  try {
    // Valida y transforma el DTO
    const parsed = ReporteDisenoDTOSchema.parse(reporte);
    // Petición POST
    const response = await apiService.post<ReporteDiseño>(
      '/ReporteDiseño',
      parsed
    );
    return response.data;
  } catch (error) {
    console.error('Error al crear el reporte de diseño:', error);
    throw error;
  }
}

/**
 * Actualiza un reporte de diseño existente.
 */
export async function putReporteDiseño(
  {
    reporte,
  }: {
    reporte: {
      id: string;
      SeccionId: string;
      PaginaInicio: string;
      PaginaFin: string;
      HoraInicio: string;
      HoraFin: string;
      Observacion?: string;
    };
  }
): Promise<ReporteDiseño | null> {
  const { id, SeccionId, PaginaInicio, PaginaFin, HoraInicio, HoraFin, Observacion } = reporte;

  const dto = {
    SeccionId,
    PaginaInicio,
    PaginaFin,
    HoraInicio,
    HoraFin,
    Observacion,
  };

  try {
    // Valida el DTO
    const parsed = ReporteDisenoDTOSchema.parse(dto);
    // Petición PUT
    const response = await apiService.put<ReporteDiseño>(
      `/ReporteDiseño/${id}`,
      parsed
    );
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar el reporte de diseño ${id}:`, error);
    return null;
  }
}
