"use server";


import apiService from "../../../lib/server";
import { ConfigItem, OutputConfig } from "./type";
// import { ClienteElementSchema } from "./schema";

export async function getConfiguracionAprobacion() {
  try {
    const response = await apiService.get<ConfigItem[]>("/ConfiguracionAprobacion");
    return response.data;
  } catch (error) {
    console.error("Error al obtener las configuraciones:", error);
    return [];
  }
}



// export async function putPuesto({ puesto }: { puesto: OutputConfig }) {

//   try {

//     const response = await apiService.put(`/Puesto/${puesto.}`, puesto);

//     return response.data;
//   } catch (error) {
//     console.error("Error al actualizar el puesto:", error);
//     return [];
//   }
// }

export async function getPuestoId(id: string) {
  try {
    const response = await apiService.get<OutputConfig>(`/Puesto/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el puesto:", error);
    return null;
  }
}


export async function postConfig({ config }: { config: OutputConfig[] }) {
  try {
    const response = await apiService.post("/ConfiguracionAprobacion", config);

    return response.data;
  } catch (error) {
    console.error("Error al crear el puesto:", error);
    throw error;
  }
}

