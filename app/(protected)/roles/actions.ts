"use server";

import { PermisosRol, Rol } from "@/lib/Types";
import apiService from "../../../lib/server";
// import { ClienteElementSchema } from "./schema";

export async function getRolesPermisos() {
  try {
    const response = await apiService.get<Rol[]>("/Rol");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los Rols y permisos:", error);
    return [];
  }
}
export async function getRolsActivos() {
  try {
    const response = await apiService.get<Rol[]>("/Rol/activos");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los Rols y permisos:", error);
    return [];
  }
}

export async function putRol({ rol }: { rol: Rol }) {
  const permisosIds = rol.permisos.map((permiso: PermisosRol) => permiso.id);

  const rolData = {
    ...rol,
    permisosRol: permisosIds,
  };
  try {
    const response = await apiService.put(`/Rol/${rol.id}`, rolData);

    return response.data;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

export async function getRolsPermisoById(id: string) {
  try {
    const response = await apiService.get<Rol>(`/Rol/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el estado servicio:", error);
    return null;
  }
}
export async function postRol({ rol }: { rol: Rol }) {
  try {
    const response = await apiService.post("/Rol", rol); // Envía el rol con los IDs
    return response.data;
  } catch (error) {
    console.error("Error al crear el rol en el servicio:", error);
    throw error;
  }
}

