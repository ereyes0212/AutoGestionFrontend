"use server";

import { Empresa } from "@/lib/Types";
import apiService from "../../../lib/server";
// import { ClienteElementSchema } from "./schema";

export async function getEmpresas() {
  try {
    const response = await apiService.get<Empresa[]>("/Empresa");
    return response.data;
  } catch (error) {
    console.error("Error al obtener las empresas:", error);
    return [];
  }
}
export async function getEmpresasActivas() {
  try {
    const response = await apiService.get<Empresa[]>("/Empresa/active");
    return response.data;
  } catch (error) {
    console.error("Error al obtener las empresas:", error);
    return [];
  }
}


export async function putEmpresa({ empresa }: { empresa: Empresa }) {

  try {

    const response = await apiService.put(`/Empresa/${empresa.id}`, empresa);

    return response.data;
  } catch (error) {
    console.error("Error al actualizar la empresa:", error);
    return [];
  }
}

export async function getEmpresaId(id: string) {
  try {
    const response = await apiService.get<Empresa>(`/Empresa/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener la empresa:", error);
    return null;
  }
}

export async function postEmpresa({ empresa }: { empresa: Empresa }) {
  try {
    const response = await apiService.post("/Empresa", empresa);
    return response.data;
  } catch (error) {
    console.error("Error al crear la empresa:", error);
    throw error; 
  }
}

