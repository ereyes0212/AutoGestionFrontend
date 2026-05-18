import { jwtVerify, type JWTPayload } from "jose";

const key = new TextEncoder().encode(process.env.AUTH_SECRET!);

export interface UsuarioSesion extends JWTPayload {
  IdUser: string;
  User: string;
  Rol: string;
  IdRol: string;
  IdEmpleado: string;
  Permiso: string[];
  DebeCambiar: boolean;
  Puesto: string;
  PuestoId: string;
}

export const decryptSessionToken = async (token: string): Promise<UsuarioSesion | null> => {
  try {
    const { payload } = await jwtVerify<JWTPayload>(token, key, {
      algorithms: ["HS256"],
    });

    return {
      IdUser: payload.IdUser as string,
      User: payload.User as string,
      Rol: payload.Rol as string,
      IdRol: payload.IdRol as string,
      IdEmpleado: payload.IdEmpleado as string,
      Permiso: (payload.Permiso as string[]) || [],
      DebeCambiar: payload.DebeCambiar === true || payload.DebeCambiar === "True",
      Puesto: payload.Puesto as string,
      PuestoId: payload.PuestoId as string,
      iss: payload.iss as string,
      aud: payload.aud as string,
    };
  } catch {
    return null;
  }
};
