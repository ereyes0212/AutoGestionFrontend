/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BarcodeScanner() {
    const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
    const router = useRouter();

    useEffect(() => {
        const newScanner = new Html5QrcodeScanner(
            "reader",
            {
                qrbox: {
                    width: 250,
                    height: 250,
                },
                fps: 10,
            },
            false
        );

        newScanner.render(onScanSuccess, onScanError);
        setScanner(newScanner);

        return () => {
            if (scanner) {
                scanner.clear();
            }
        };
    }, []);

    const onScanSuccess = async (decodedText: string) => {
        if (scanner) {
            scanner.clear();
        }
        router.push(`/inventario/activo/check/${decodedText}`);
    };

    const onScanError = (error: any) => {
        console.warn(`Error al escanear: ${error}`);
    };

    return (
        <div className="space-y-4">
            <div id="reader" className="w-full"></div>
        </div>
    );
} 