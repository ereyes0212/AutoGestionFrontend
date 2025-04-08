"use server";

import { Permiso, PermisosRol } from "@/lib/Types";
import apiService from "../../../lib/server";
// import { ClienteElementSchema } from "./schema";

export async function getPermisos() {
  try {
    const response = await apiService.get<Permiso[]>("/Permiso");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los Perisos:", error);
    return [];
  }
}
export async function getPermisosActivos() {
  try {
    const response = await apiService.get<PermisosRol[]>("/Permiso/active");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los Perisos:", error);
    return [];
  }
}


export async function getEstadoservicioById(id: string) {
  try {
    const response = await apiService.get<Permiso>(`/Permiso/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el estado servicio:", error);
    return null;
  }
}
