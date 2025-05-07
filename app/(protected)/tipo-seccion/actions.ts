"use server";


import ApiService from "@/lib/server";
import { TipoSeccion } from "./types";
// import { ClienteElementSchema } from "./schema";

export async function getTipoSeccion() {
  try {
    const response = await ApiService.get<TipoSeccion[]>("/TipoSeccion");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los Tipo de sección:", error);
    return [];
  }
}
export async function getTipoSeccionActivas() {
  try {
    const response = await ApiService.get<TipoSeccion[]>("/TipoSeccion/activos");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los Tipo de sección activos:", error);
    return [];
  }
}


export async function putTipoSeccion({ tipoSeccion }: { tipoSeccion: TipoSeccion }) {

  try {

    const response = await ApiService.put(`/TipoSeccion/${tipoSeccion.id}`, tipoSeccion);

    return response.data;
  } catch (error) {
    console.error("Error al actualizar el tipo de sección:", error);
    return [];
  }
}

export async function getTipoSeccionId(id: string) {
  try {
    const response = await ApiService.get<TipoSeccion>(`/TipoSeccion/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el tipo de sección:", error);
    return null;
  }
}



export async function postTipoSeccion({ tipoSeccion }: { tipoSeccion: TipoSeccion }) {
  try {
    const response = await ApiService.post("/TipoSeccion", tipoSeccion);

    return response.data;
  } catch (error) {
    console.error("Error al crear el tipo de sección:", error);
    throw error;
  }
}

