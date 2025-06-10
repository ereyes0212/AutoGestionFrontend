/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, FlipHorizontal, Scan, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function BarcodeScanner() {
    const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
    const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
    const router = useRouter();

    // Inicia el escáner cuando isScanning sea true
    useEffect(() => {
        let active = true;
        const initScanner = async () => {
            try {
                const devices = await Html5Qrcode.getCameras();
                if (!active) return;
                if (devices && devices.length) {
                    setCameras(devices);
                    const newScanner = new Html5Qrcode("reader");
                    await newScanner.start(
                        devices[currentCameraIndex].id,
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0,
                        },
                        onScanSuccess,
                        onScanError
                    );
                    setScanner(newScanner);
                } else {
                    toast.error("No se encontraron cámaras disponibles");
                    setIsScanning(false);
                }
            } catch (err) {
                console.error("Error al iniciar la cámara:", err);
                toast.error("Error al iniciar la cámara");
                setIsScanning(false);
            }
        };

        if (isScanning && !scanner) {
            initScanner();
        }

        return () => {
            active = false;
        };
    }, [isScanning, currentCameraIndex]);

    // Limpia al desmontar
    useEffect(() => {
        return () => {
            if (scanner) {
                scanner.stop().then(() => scanner.clear());
            }
        };
    }, [scanner]);

    const stopScanner = () => {
        if (scanner) {
            scanner.stop().then(() => {
                scanner.clear();
                setScanner(null);
                setIsScanning(false);
            });
        }
    };

    const switchCamera = async () => {
        if (scanner && cameras.length > 1) {
            await scanner.stop();
            setCurrentCameraIndex((prev) => (prev + 1) % cameras.length);
        }
    };

    const onScanSuccess = (decodedText: string) => {
        toast.success("Código escaneado correctamente");
        stopScanner();
        router.push(`/inventario/activo/check/${decodedText}`);
    };

    const onScanError = (error: any) => {
        console.warn(`Error al escanear: ${error}`);
    };

    return (
        <Card className="p-6">
            <div className="space-y-4">
                {!isScanning ? (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-gray-50">
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-4 bg-primary/10 rounded-full">
                                <Scan className="h-8 w-8 text-primary" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold">Escanear Código de Barras</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Activa la cámara para escanear el código de barras del activo
                                </p>
                            </div>
                            <Button
                                onClick={() => setIsScanning(true)}
                                className="flex items-center gap-2"
                                size="lg"
                            >
                                <Camera className="h-5 w-5" />
                                Activar Cámara
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="absolute top-0 left-0 right-0 p-4 bg-black/50 text-white text-center z-10">
                            <p className="text-sm">Apunta la cámara al código de barras</p>
                        </div>
                        <div
                            id="reader"
                            className="w-full aspect-square rounded-lg overflow-hidden"
                            style={{ minHeight: '300px' }}
                        ></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent z-10 flex justify-between items-center">
                            <Button
                                onClick={switchCamera}
                                variant="secondary"
                                size="icon"
                                className={cameras.length <= 1 ? "hidden" : ""}
                                title="Cambiar cámara"
                            >
                                <FlipHorizontal className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={stopScanner}
                                variant="destructive"
                                size="icon"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
