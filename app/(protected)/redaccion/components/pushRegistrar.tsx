'use client';
import { subscribeToPush } from '@/lib/push';
import { useEffect } from 'react';

export default function PushRegistrar({ empleadoId }: { empleadoId?: string }) {
    useEffect(() => {
        if (!empleadoId) return;

        (async () => {
            try {
                await subscribeToPush(empleadoId);
            } catch (err) {
                console.error("❌ Error al registrar push", err);
            }
        })();
    }, [empleadoId]);

    return null;
}
