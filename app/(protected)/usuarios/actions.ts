"use server";


import apiService from "../../../lib/server";
import { Usuario, UsuarioCreate, UsuarioUpdate } from "./type";
// import { ClienteElementSchema } from "./schema";

export async function getUsuarios() {
  try {
    const response = await apiService.get<Usuario[]>("/Usuario");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    return [];
  }
}


// Función para crear usuario
// Función para crear usuario
export async function postUsuario({ usuario }: { usuario: UsuarioCreate }): Promise<UsuarioCreate> {
  try {
    const response = await apiService.post<UsuarioCreate>("/Usuario", usuario);
    return response.data; // Retorna la data del usuario creado
  } catch (error) {
    console.error("Error en postUsuario:", error);
    throw new Error("Error al crear el usuario");
  }
}

// Función para actualizar usuario
export async function putUsuario({ usuario }: { usuario: UsuarioUpdate }): Promise<UsuarioUpdate> {
  try {
    const response = await apiService.put<UsuarioUpdate>(`/Usuario/${usuario.id}`, usuario);
    return response.data; // Retorna la data del usuario actualizado
  } catch (error) {
    console.error("Error en putUsuario:", error);
    throw new Error("Error al actualizar el usuario");
  }
}


export async function getUsuarioById(id: string): Promise<Usuario | null> {
  try {
    const response = await apiService.get<Usuario>(`/Usuario/${id}`);
    // Aseguramos que si alguno de los campos opcionales está ausente, se maneje correctamente
    const usuarioData = response.data;

    return usuarioData || null;
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    return null;
  }
}

