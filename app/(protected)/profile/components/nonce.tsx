'use client';

export default function BotonFetchNonce() {
    const obtenerNuevoNonce = async () => {
        const response = await fetch("https://tiempo.hn/wp-admin/admin-ajax.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                action: "generar_nuevo_nonce"
            }),
        });

        const data = await response.json();
        if (data.success) {
            console.log("Nonce recibido:", data.data.nonce);
        } else {
            console.error("Error al obtener el nuevo nonce");
        }
    };

    return (
        <div className="mt-4">
            <button
                onClick={obtenerNuevoNonce}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
                Obtener nuevo nonce
            </button>
        </div>
    );
}
