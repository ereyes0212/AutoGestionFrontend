'use client';

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useRef } from "react";
import Barcode from "react-barcode";

export function BarcodeWithDownload({ code, nombre }: { code: string; nombre: string }) {
    const barcodeRef = useRef<HTMLDivElement>(null);

    const handleDownload = () => {
        const svg = barcodeRef.current?.querySelector('svg');
        if (!svg) {
            console.error("SVG no encontrado");
            return;
        }

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height + 20;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            ctx.fillStyle = "#000";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillText(nombre, canvas.width / 2, img.height + 15);

            URL.revokeObjectURL(url);
            const link = document.createElement("a");
            link.download = `barcode-${code}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        };

        img.src = url;
    };

    return (
        <div className="flex items-center gap-2">
            <div ref={barcodeRef} className="flex items-center">
                <Barcode
                    value={code}
                    format="CODE39"
                    width={1}
                    height={40}
                    background="#ffffff"
                    displayValue={true}
                    lineColor="#000000"
                    fontSize={10}
                />
            </div>
            <Button
                onClick={handleDownload}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
            >
                <Download className="h-4 w-4" />
            </Button>
        </div>
    );
}
