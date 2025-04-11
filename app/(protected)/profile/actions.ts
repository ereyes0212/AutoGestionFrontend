"use server";

import apiService from "../../../lib/server";
import { Employee } from "./type";
// import { ClienteElementSchema } from "./schema";

export async function getProfile() {
  try {
    const response = await apiService.get<Employee>("Empleado/Profile");
    return response.data;
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    return null;
  }
}


