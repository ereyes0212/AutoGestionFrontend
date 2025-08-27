// schemas/chat.ts
import { z } from "zod";

/* ---------- Enums ---------- */
export const TipoConversacionEnum = z.enum(["GROUP", "PRIVATE"]);
export type TipoConversacion = z.infer<typeof TipoConversacionEnum>;

/* ---------- Usuario minimal (frontend) ---------- */
export const UsuarioMinSchema = z.object({
    id: z.string().uuid(),
    usuario: z.string().max(100),
    nombreCompleto: z.string().max(200).nullable().optional(),
    avatarUrl: z.string().url().nullable().optional()
});
export type UsuarioMin = z.infer<typeof UsuarioMinSchema>;

/* ---------- Attachment ---------- */
export const AttachmentSchema = z.object({
    id: z.string().uuid(),
    mensajeId: z.string().uuid(),
    url: z.string().url(),
    tipo: z.string().max(50).nullable().optional(),
    nombre: z.string().max(255).nullable().optional(),
    tamano: z.number().int().nullable().optional(),
    createdAt: z.string() // ISO
});
export type Attachment = z.infer<typeof AttachmentSchema>;

/* ---------- MensajeEstado ---------- */
export const MensajeEstadoSchema = z.object({
    id: z.string().uuid(),
    mensajeId: z.string().uuid(),
    usuarioId: z.string().uuid(),
    entregado: z.boolean(),
    leido: z.boolean(),
    entregadoAt: z.string().nullable().optional(),
    leidoAt: z.string().nullable().optional()
});
export type MensajeEstado = z.infer<typeof MensajeEstadoSchema>;

/* ---------- Mensaje ---------- */
export const MensajeSchema = z.object({
    id: z.string().uuid(),
    conversacionId: z.string().uuid(),
    autorId: z.string().uuid(),
    contenido: z.string().max(20000),
    editedAt: z.string().nullable().optional(),
    deletedAt: z.string().nullable().optional(),
    attachments: z.array(AttachmentSchema).optional(),
    estados: z.array(MensajeEstadoSchema).optional(),
    createdAt: z.string()
});
export type Mensaje = z.infer<typeof MensajeSchema>;

/* ---------- Participante ---------- */
export const ParticipanteSchema = z.object({
    id: z.string().uuid(),
    conversacionId: z.string().uuid(),
    usuarioId: z.string().uuid(),
    usuario: UsuarioMinSchema.optional(),
    lastReadAt: z.string().nullable().optional(),
    rol: z.string().max(50).nullable().optional(),
    joinedAt: z.string().optional()
});
export type Participante = z.infer<typeof ParticipanteSchema>;

/* ---------- Conversacion ---------- */
export const ConversacionSchema = z.object({
    id: z.string().uuid(),
    nombre: z.string().max(255).nullable().optional(),
    tipo: TipoConversacionEnum,
    creadorId: z.string().uuid().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
    participantes: z.array(ParticipanteSchema).optional(),
    mensajes: z.array(MensajeSchema).optional()
});
export type Conversacion = z.infer<typeof ConversacionSchema>;

/* ---------- ChatListItem (lo que devuelve la lista de chats) ---------- */
export const ChatListItemSchema = z.object({
    id: z.string().uuid(),
    nombre: z.string().nullable().optional(),
    tipo: TipoConversacionEnum,
    creadorId: z.string().uuid().nullable().optional(),
    participantes: z.array(UsuarioMinSchema),
    lastMessage: z
        .object({
            id: z.string().uuid(),
            contenido: z.string().max(20000),
            autorId: z.string().uuid(),
            autorUsuario: z.string().nullable().optional(),
            createdAt: z.string(),
            editedAt: z.string().nullable().optional()
        })
        .nullable()
        .optional(),
    unreadCount: z.number().int().nonnegative(),
    updatedAt: z.string().optional(),
    createdAt: z.string().optional()
});
export type ChatListItem = z.infer<typeof ChatListItemSchema>;

/* ---------- Payloads (requests) ---------- */

// Crear grupo
export const CreateGroupPayload = z.object({
    nombre: z.string().min(1).max(255),
    creadorId: z.string().uuid(),
    participantesIds: z.array(z.string().uuid()).min(1) // incluye creador normalmente
});
export type CreateGroupPayloadType = z.infer<typeof CreateGroupPayload>;

// Crear conversación privada (1-a-1) -> recibe los 2 ids
export const CreatePrivatePayload = z.object({
    userAId: z.string().uuid(),
    userBId: z.string().uuid()
});
export type CreatePrivatePayloadType = z.infer<typeof CreatePrivatePayload>;

// Agregar participantes a grupo existente
export const AddParticipantsPayload = z.object({
    conversacionId: z.string().uuid(),
    participantesIds: z.array(z.string().uuid()).min(1)
});
export type AddParticipantsPayloadType = z.infer<typeof AddParticipantsPayload>;

// Enviar mensaje
export const SendMessagePayload = z.object({
    conversacionId: z.string().uuid(),
    autorId: z.string().uuid(),
    contenido: z.string().min(1).max(20000),
    attachments: z.array(
        z.object({
            url: z.string().url(),
            tipo: z.string().max(50).nullable().optional(),
            nombre: z.string().max(255).nullable().optional(),
            tamano: z.number().int().nullable().optional()
        })
    ).optional()
});
export type SendMessagePayloadType = z.infer<typeof SendMessagePayload>;

// Marcar mensajes como leídos (batch)
export const MarkAsReadPayload = z.object({
    conversacionId: z.string().uuid(),
    usuarioId: z.string().uuid(),
    messageIds: z.array(z.string().uuid()).optional()
});
export type MarkAsReadPayloadType = z.infer<typeof MarkAsReadPayload>;

export const ConversationSchema = z.object({
    nombre: z
        .string()
        .min(1, "El nombre del grupo es requerido")
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(50, "El nombre no puede exceder 50 caracteres"),
    userIds: z
        .array(z.string())
        .min(2, "Selecciona al menos 2 usuarios")
        .max(20, "No puedes seleccionar más de 20 usuarios"),
})
