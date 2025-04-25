"use server";


import apiService from "../../../lib/server";
import { Solicitud } from "./schema";
import { SolicitudPermiso, Aprobacion, SolicitudAprobacion } from "./type";
// import { ClienteElementSchema } from "./schema";

export async function getSolicitudesByEmpleado() {
  try {
    const response = await apiService.get<SolicitudPermiso[]>("/SolicitudVacaciones/empleado");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los empleados:", error);
    return [];
  }
}
export async function getSolicitudesAprobaciones() {
  try {
    const response = await apiService.get<SolicitudAprobacion[]>("/SolicitudVacaciones/aprobaciones/empleado");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los empleados:", error);
    return [];
  }
}
export async function getSolicitudesAprobacionesHistorico() {
  try {
    const response = await apiService.get<SolicitudAprobacion[]>("/SolicitudVacaciones/aprobaciones/empleado/historico");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los empleados:", error);
    return [];
  }
}
export async function getSolicitudesById(id: string) {
  try {
    const response = await apiService.get<SolicitudPermiso>(`/SolicitudVacaciones/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los empleados:", error);
    return null;
  }
}

// export async function getEmpleadosSinUsuario() {
//   try {
//     const response = await apiService.get<Empleado[]>("/Empleado/disponibles");
//     return response.data;
//   } catch (error) {
//     console.error("Error al obtener los empleados:", error);
//     return [];
//   }
// }

export async function putSolicitud({ solicitud }: { solicitud: Solicitud }) {
  try {
    const response = await apiService.put(`/SolicitudVacaciones/${solicitud.id}`, solicitud);

    return response.data;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}
interface ProcessApprovalParams {
  id: string
  nivel: number
  aprobado: boolean
  comentarios: string
}
export async function processApproval({
  id,
  nivel,
  aprobado,
  comentarios,
}: ProcessApprovalParams) {
  try {
    const query = new URLSearchParams({
      nivel: nivel.toString(),
      aprobado: String(aprobado),
      comentarios,
    }).toString()

    const response = await apiService.put(
      `/solicitudvacaciones/${id}/aprobar?${query}`, {}
    )
    console.log("🚀 ~ response:", response.config.baseURL)
    return response.data
  } catch (error) {
    console.error("Error procesando aprobación:", error)
    throw error
  }
}


export async function postSolicitud({ Solicitud }: { Solicitud: Solicitud }) {
  try {
    const response = await apiService.post("/SolicitudVacaciones", Solicitud);
    return response.data;
  } catch (error) {
    console.error("Error al crear empleado:", error);
    throw error;
  }
}
// export async function getEmpleadoId(id: string) {
//   try {
//     const response = await apiService.get<Empleado>(`/Empleado/${id}`);
//     return response.data;
//   } catch (error) {
//     console.error("Error al obtener el empleado:", error);
//     return null;
//   }
// }

