// tipos comunes
export enum TipoConversacion {
    GROUP = "GROUP",
    PRIVATE = "PRIVATE",
}

export interface UsuarioMin {
    id: string;
    usuario: string;
    empleado_id?: string;
    // agrega otros campos mínimos que necesites (avatar, nombre completo, etc.)
    nombreCompleto?: string;
    avatarUrl?: string;
}

// participante en una conversación
export interface ParticipantType {
    id: string; // id de Participante
    usuarioId: string;
    usuario?: UsuarioMin;
    role?: string | null;
    lastReadAt?: string | null; // ISO
    joinedAt?: string; // ISO
}

// attachment en un mensaje
export interface AttachmentType {
    id: string;
    mensajeId: string;
    url: string;
    tipo?: string | null; // "image" | "video" | "file"
    nombre?: string | null;
    tamano?: number | null;
    createdAt: string; // ISO
}

// estado de mensaje por usuario (entregado/leído)
export interface MessageStateType {
    id: string;
    mensajeId: string;
    usuarioId: string;
    entregado: boolean;
    leido: boolean;
    entregadoAt?: string | null;
    leidoAt?: string | null;
}

// mensaje
export interface MessageType {
    id: string;
    conversacionId: string;
    autorId: string;
    autor?: UsuarioMin;
    contenido: string;
    editedAt?: string | null;
    deletedAt?: string | null;
    attachments?: AttachmentType[];
    estados?: MessageStateType[];
    createdAt: string; // ISO
}

// item en la lista de chats (lo que necesitas para renderizar la pantalla)
export interface ChatListItem {
    id: string;                       // conversacion.id
    nombre?: string | null;           // nombre del grupo (o null para private)
    tipo: TipoConversacion;
    creadorId?: string | null;
    participantes: UsuarioMin[];      // lista de usuarios (mínimos) para mostrar avatar + nombre
    lastMessage?: {
        id: string;
        contenido: string;
        autorId: string;
        autorUsuario?: string;
        createdAt: string;
        editedAt?: string | null;
    } | null;
    unreadCount: number;              // mensajes no leídos por el usuario logueado
    updatedAt?: string | null;        // para ordenar por actividad
    createdAt?: string | null;
}

export type Mensaje = {
    id: string;
    contenido: string;
    createdAt: string; // string en lugar de Date
    autor: {
        id: string;
        usuario: string;
    };
    attachments?: {
        id: string;
        nombre: string | null;
        url: string;
        tipo?: string | null;
        tamaño?: number | null;
        createdAt: string;
    }[];
    estados?: {
        id: string;
        usuarioId: string;
        entregado: boolean;
        leido: boolean;
        entregadoAt?: string | null;
        leidoAt?: string | null;
    }[];
};
