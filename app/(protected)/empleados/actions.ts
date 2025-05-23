"use server";


import apiService from "../../../lib/server";
import { Empleado } from "./type";
// import { ClienteElementSchema } from "./schema";

export async function getEmpleados() {
  try {
    const response = await apiService.get<Empleado[]>("/Empleado");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los empleados:", error);
    return [];
  }
}

export async function getEmpleadosSinUsuario() {
  try {
    const response = await apiService.get<Empleado[]>("/Empleado/disponibles");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los empleados:", error);
    return [];
  }
}

export async function putEmpleado({ empleado }: { empleado: Empleado }) {

  try {
    const empleados = {
      ...empleado
    }
    const response = await apiService.put(`/Empleado/${empleado.id}`, empleados);

    return response.data;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

export async function getEmpleadoId(id: string) {
  try {
    const response = await apiService.get<Empleado>(`/Empleado/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el empleado:", error);
    return null;
  }
}

export async function postEmpleado({ empleado }: { empleado: Empleado }) {
  try {
    const empleados = {
      ...empleado
    }
    const response = await apiService.post("/Empleado", empleados);
    return response.data;
  } catch (error) {
    console.error("Error al crear empleado:", error);
    throw error; 
  }
}

