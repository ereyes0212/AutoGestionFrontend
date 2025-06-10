"use client";

import JsBarcode from 'jsbarcode';
import { useEffect, useRef } from 'react';

interface BarcodeGeneratorProps {
    codigoBarra: string;
    width?: number;
    height?: number;
}

export const BarcodeGenerator = ({
    codigoBarra,
    width = 2,
    height = 100
}: BarcodeGeneratorProps) => {
    const barcodeRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (barcodeRef.current) {
            JsBarcode(barcodeRef.current, codigoBarra, {
                format: "CODE128",
                width: width,
                height: height,
                displayValue: true,
                fontSize: 20,
                margin: 10
            });
        }
    }, [codigoBarra, width, height]);

    return (
        <div className="flex flex-col items-center">
            <svg ref={barcodeRef} />
            <p className="mt-2 text-sm text-gray-600">{codigoBarra}</p>
        </div>
    );
}; 