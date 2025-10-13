// pages/api/socket-token.ts
import { decrypt } from "@/auth"; // debe exportarse en tu módulo auth
import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // En pages API, las cookies están en req.cookies
        const token = req.cookies?.session as string | undefined;
        if (!token) {
            return res.status(401).json({ error: "Unauthenticated" });
        }

        const session = await decrypt(token); // asumiendo decrypt devuelve UsuarioSesion | null
        if (!session || !session.IdUser) {
            return res.status(401).json({ error: "Unauthenticated" });
        }

        const payload = { id: session.IdUser, usuario: session?.UserName ?? session?.Usuario ?? null };
        const socketToken = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "2h" });
        return res.status(200).json({ token: socketToken });
    } catch (err) {
        console.error("socket-token error:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
