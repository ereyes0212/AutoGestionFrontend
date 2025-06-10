"use client";

import { BarcodeGenerator } from "./BarcodeGenerator";

interface PrintBarcodeProps {
    codigoBarra: string;
    nombre: string;
}

export const PrintBarcode = ({ codigoBarra, nombre }: PrintBarcodeProps) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="print:mx-auto print:my-4">
            <div className="flex flex-col items-center p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">{nombre}</h3>
                <BarcodeGenerator codigoBarra={codigoBarra} />
                <button
                    onClick={handlePrint}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 print:hidden"
                >
                    Imprimir
                </button>
            </div>
        </div>
    );
}; 