
import { z } from "zod";

export const schemaSignIn = z.object({
    usuario: z
        .string({ message: "El nombre de usuario es requerido" })
        .min(1, { message: "El nombre de usuario es requerido" }),
    contrasena: z
        .string({ message: "La contrasenÞa es requerida" })
        .min(1, { message: "La contrasenÞa es requerida" }),
});
export type TSchemaSignIn = z.infer<typeof schemaSignIn>;