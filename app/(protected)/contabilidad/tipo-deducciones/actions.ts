"use server";


import ApiService from "@/lib/server";
import { TipoDeduccion } from "./types";
// import { ClienteElementSchema } from "./schema";

export async function getTipoDeduccion() {
  try {
    const response = await ApiService.get<TipoDeduccion[]>("/TipoDeduccion");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los Tipo de deducción:", error);
    return [];
  }
}
export async function getTipoDeduccionActivas() {
  try {
    const response = await ApiService.get<TipoDeduccion[]>("/TipoDeduccion/activos");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los Tipo de Deduccion activos:", error);
    return [];
  }
}


export async function putTipoDeduccion({ tipoDeduccion }: { tipoDeduccion: TipoDeduccion }) {

  try {

    const response = await ApiService.put(`/TipoDeduccion/${tipoDeduccion.id}`, tipoDeduccion);

    return response.data;
  } catch (error) {
    console.error("Error al actualizar el tipo de Deduccion:", error);
    return [];
  }
}

export async function getTipoDeduccionId(id: string) {
  try {
    const response = await ApiService.get<TipoDeduccion>(`/TipoDeduccion/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el tipo de deduccion:", error);
    return null;
  }
}



export async function postTipoDeduccion({ tipoDeduccion }: { tipoDeduccion: TipoDeduccion }) {
  try {
    const response = await ApiService.post("/TipoDeduccion", tipoDeduccion);

    return response.data;
  } catch (error) {
    console.error("Error al crear el tipo de deducción:", error);
    throw error;
  }
}

