// components/ClientProviders.tsx
"use client";

import React from "react";
import PushRegistrar from "../(protected)/redaccion/components/pushRegistrar";
import SocketNotifier from "./SocketNotifier";

export default function ClientProviders({
    children,
    empleadoId,
    currentUserId,
    getActiveConversationId,
}: {
    children: React.ReactNode;
    empleadoId?: string | number | null;
    currentUserId: string;
    getActiveConversationId?: () => string | null;
}) {
    return (
        <>
            {/* PushRegistrar (si necesita empleadoId) */}
            {empleadoId ? <PushRegistrar empleadoId={String(empleadoId)} /> : null}

            {/* SocketNotifier (escucha mensajes y muestra toast) */}
            <SocketNotifier
                currentUserId={currentUserId}
                getActiveConversationId={getActiveConversationId}
            />

            {/* children de la app */}
            {children}
        </>
    );
}
