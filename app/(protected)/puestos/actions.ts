"use server";


import apiService from "../../../lib/server";
import { Puesto } from "./types";
// import { ClienteElementSchema } from "./schema";

export async function getPuestos() {
  try {
    const response = await apiService.get<Puesto[]>("/Puesto");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los puesto:", error);
    return [];
  }
}
export async function getPuestosActivas() {
  try {
    const response = await apiService.get<Puesto[]>("/Puesto/activos");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los puestos:", error);
    return [];
  }
}


export async function putPuesto({ puesto }: { puesto: Puesto }) {

  try {

    const response = await apiService.put(`/Puesto/${puesto.id}`, puesto);

    return response.data;
  } catch (error) {
    console.error("Error al actualizar el puesto:", error);
    return [];
  }
}

export async function getPuestoId(id: string) {
  try {
    const response = await apiService.get<Puesto>(`/Puesto/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el puesto:", error);
    return null;
  }
}
export async function getPuestoByEmpresaId() {
  try {
    const response = await apiService.get<Puesto>(`/Puesto/empresaId`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el puesto:", error);
    return null;
  }
}
export async function getPuestoActivosByEmpresaId() {
  try {
    const response = await apiService.get<Puesto[]>(`/Puesto/activos/empresa`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el puesto:", error);
    return null;
  }
}

export async function postPuesto({ puesto }: { puesto: Puesto }) {
  try {
    const response = await apiService.post("/Puesto", puesto);

    return response.data;
  } catch (error) {
    console.error("Error al crear el puesto:", error);
    throw error; 
  }
}

