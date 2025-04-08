"use server";

import { Permiso, PermisosRol } from "@/lib/Types";
import apiService from "../../../lib/server";
// import { ClienteElementSchema } from "./schema";

export async function getPermisos() {
  try {
    const response = await apiService.get<Permiso[]>("Rol/permisos");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los Permisos:", error);
    return [];
  }
}
export async function getPermisosActivos() {
  try {
    const response = await apiService.get<PermisosRol[]>("Rol/permisosrol");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los Permisos:", error);
    return [];
  }
}

