"use server";


import apiService from "../../../lib/server";
import { Solicitud } from "./schema";
import { SolicitudPermiso, Aprobacion } from "./type";
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

