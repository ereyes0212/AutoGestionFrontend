"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileDown, FileText } from "lucide-react";
import { Activo } from "../../../types";

interface Registro {
    id: string;
    fecha: Date;
    tipo: string;
    descripcion: string;
}

interface RegistrosListProps {
    activo: Activo;
    registros: Registro[];
}

export default function RegistrosList({ activo, registros }: RegistrosListProps) {
    const generarPDF = () => {
        const doc = new jsPDF();

        // Título
        doc.setFontSize(16);
        doc.text("Reporte de Registros de Activo", 14, 15);

        // Información del activo
        doc.setFontSize(12);
        doc.text(`Activo: ${activo.nombre}`, 14, 25);
        doc.text(`Código de Barras: ${activo.codigoBarra}`, 14, 32);
        doc.text(`Categoría: ${activo.categoria?.nombre}`, 14, 39);
        doc.text(`Estado Actual: ${activo.estadoActual?.nombre}`, 14, 46);

        // Tabla de registros
        const tableData = registros.map(registro => [
            new Date(registro.fecha).toLocaleDateString(),
            registro.tipo,
            registro.descripcion
        ]);

        autoTable(doc, {
            startY: 55,
            head: [['Fecha', 'Tipo', 'Descripción']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] }
        });

        // Guardar el PDF
        doc.save(`registros_${activo.codigoBarra}.pdf`);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>{activo.nombre}</CardTitle>
                        <CardDescription>
                            Código de barras: {activo.codigoBarra}
                        </CardDescription>
                    </div>
                    <Button
                        onClick={generarPDF}
                        className="flex items-center gap-2"
                    >
                        <FileDown className="h-4 w-4" />
                        Generar Reporte
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {registros.length === 0 ? (
                        <p className="text-center text-gray-500">
                            No hay registros disponibles
                        </p>
                    ) : (
                        registros.map((registro) => (
                            <div key={registro.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-gray-500" />
                                        <span className="font-medium">
                                            {registro.tipo}
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {new Date(registro.fecha).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {registro.descripcion}
                                </p>
                                <Separator />
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 