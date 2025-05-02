// components/PayrollListMobile.tsx
"use client";

import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clipboard, Clock, DollarSign, Search, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { RegistroPago } from "../type";

interface PayrollListMobileProps {
    registros: RegistroPago[];
}

export default function PayrollListMobile({ registros }: PayrollListMobileProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredVouchers = registros.filter(r =>
        r.empleadoNombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (s: string) =>
        format(new Date(s), "dd/MM/yyyy", { locale: es });

    const formatCurrency = (n: number) =>
        new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" }).format(n);

    return (
        <div className="space-y-4 p-4">
            <div className="relative">
                <Input
                    placeholder="Buscar pago por empleado…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            {filteredVouchers.map(reg => {
                const quincenal = reg.salarioMensual / 2;
                return (
                    <Link
                        key={reg.id}
                        href={`/voucher-pago/${reg.id}/detalle`}
                        className="p-4 border rounded-lg shadow flex flex-col gap-2"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-base truncate">
                                <User className="inline h-4 w-4 mr-1 text-gray-500" />
                                {reg.empleadoNombre}
                            </h3>
                            <Clipboard className="h-5 w-5 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(reg.fechaPago)}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {reg.diasTrabajados} días
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Quincenal: {formatCurrency(quincenal)}
                        </p>
                        <p className="text-lg font-semibold text-green-600 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatCurrency(reg.netoPagar)}
                        </p>
                        {reg.observaciones && (
                            <p className="text-xs text-gray-500">Obs: {reg.observaciones}</p>
                        )}
                    </Link>
                );
            })}

            {filteredVouchers.length === 0 && (
                <p className="text-center text-gray-500">No se encontraron registros.</p>
            )}
            {filteredVouchers.length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                    Mostrando {filteredVouchers.length} de {registros.length} vouchers
                </p>
            )}
        </div>
    );
}
