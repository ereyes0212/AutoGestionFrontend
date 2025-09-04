// app/api/save-subscription/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from 'next/server';

// POST /api/save-subscription
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { empleadoId, subscription } = body as { empleadoId?: string; subscription?: any };

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'subscription missing' }, { status: 400 });
        }

        // upsert la suscripción por endpoint para evitar duplicados
        await prisma.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            update: { subscription, revoked: false, updatedAt: new Date(), empleadoId },
            create: { empleadoId, endpoint: subscription.endpoint, subscription }
        });

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err: any) {
        console.error('save-subscription error', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

// opcional: rechazar otros métodos explícitamente
export async function GET() {
    return NextResponse.json({ error: 'Method GET not allowed' }, { status: 405 });
}
