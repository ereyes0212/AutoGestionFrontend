"use server";

import { EstadoServicio, PermisosRol, Rol } from "@/lib/Types";
import apiService from "../../../lib/server";
// import { ClienteElementSchema } from "./schema";

export async function getRolesPermisos() {
  try {
    const response = await apiService.get<Rol[]>("/Role");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los roles y permisos:", error);
    return [];
  }
}
export async function getRolesActivos() {
  try {
    const response = await apiService.get<Rol[]>("/Role/active");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los roles y permisos:", error);
    return [];
  }
}

export async function putRol({ rol }: { rol: Rol }) {
  const permisosIds = rol.permisosRol.map((permiso: PermisosRol) => permiso.id);

  const rolData = {
    ...rol,
    permisosRol: permisosIds, 
  };
  try {
    const response = await apiService.put(`/Role/${rol.id}`, rolData);

    return response.data;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

export async function getRolesPermisoById(id: string) {
  try {
    const response = await apiService.get<Rol>(`/Role/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el estado servicio:", error);
    return null;
  }
}
export async function postRol({ rol }: { rol: Rol }) {
  try {
    const permisosIds = rol.permisosRol.map((permiso: PermisosRol) => permiso.id);

    const rolData = {
      ...rol,
      permisosRol: permisosIds, 
    };


    const response = await apiService.post("/Role", rolData); // Envía el rol con los IDs
    return response.data;
  } catch (error) {
    console.error("Error al crear el rol en el servicio:", error);
    throw error;
  }
}

