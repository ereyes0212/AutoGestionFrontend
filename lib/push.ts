// lib/push.ts
export function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function subscribeToPush(empleadoId: string) {
    console.log("Iniciando suscripción push...");
    console.log("Empleado ID:", empleadoId);
    // Registrar el service worker
    const registration = await navigator.serviceWorker.register("/sw.js");

    // Pedir permiso
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Permiso de notificación denegado");

    // Crear la suscripción
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
    });

    // Guardar en backend
    await fetch("/api/save-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empleadoId, subscription }),
    });

    return subscription;
}
