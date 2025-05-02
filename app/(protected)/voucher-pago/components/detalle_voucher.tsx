// components/PayrollCard.tsx
"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    ArrowRight,
    Briefcase,
    Calendar,
    CalendarDays,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    CreditCard,
    DollarSign,
    PieChart,
    User,
    XCircle,
} from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { RegistroPago } from "../type";

interface PayrollCardProps {
    registro: RegistroPago;
}

export function PayrollCard({ registro }: PayrollCardProps) {
    const [detallesExpanded, setDetallesExpanded] = useState(false);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("es-HN", {
            style: "currency",
            currency: "HNL",
        }).format(amount);

    const formatDate = (dateString: string) =>
        format(new Date(dateString), "dd 'de' MMMM, yyyy", { locale: es });

    // Calcular salario quincenal y porcentaje sobre quincena
    const salarioQuincenal = registro.salarioMensual / 2;
    const porcentajeNeto = (registro.netoPagar / salarioQuincenal) * 100;
    const totalDeducciones = registro.detalles.reduce(
        (sum, d) => sum + d.monto,
        0
    );

    const getInitials = (name: string) =>
        name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

    const handlePrint = () => {
        window.open(`/voucher/${registro.id}/imprimir`, "_blank");
    };

    return (
        <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary text-xl">
                                {getInitials(registro.empleadoNombre)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-xl">{registro.empleadoNombre}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                                <Briefcase className="h-4 w-4" />
                                {registro.empleadoPuesto}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <Badge
                            variant={registro.observaciones ? "outline" : "secondary"}
                            className="flex items-center gap-1 px-3 py-1"
                        >
                            {registro.observaciones ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4 text-amber-600" />
                            )}
                            {registro.observaciones || "Sin observaciones"}
                        </Badge>
                        <span className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(registro.fechaPago)}
                        </span>
                        <Button variant="outline" size="sm" className="mt-2" onClick={handlePrint}>
                            Imprimir
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/20 p-3 rounded-lg">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Días Trabajados
                        </span>
                        <span className="text-lg font-semibold">{registro.diasTrabajados}</span>
                    </div>

                    <div className="bg-muted/20 p-3 rounded-lg">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Clock className="h-3.5 w-3.5" />
                            Salario Diario
                        </span>
                        <span className="text-lg font-semibold">{formatCurrency(registro.salarioDiario)}</span>
                    </div>

                    <div className="bg-muted/20 p-3 rounded-lg">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            Salario Mensual
                        </span>
                        <span className="text-lg font-semibold">{formatCurrency(registro.salarioMensual)}</span>
                    </div>

                    <div className="bg-primary/10 p-3 rounded-lg">
                        <span className="text-xs text-primary/80 flex items-center gap-1 mb-1">
                            <CreditCard className="h-3.5 w-3.5" />
                            Neto a Pagar
                        </span>
                        <span className="text-lg font-semibold text-primary">{formatCurrency(registro.netoPagar)}</span>
                    </div>
                </div>

                <div className="space-y-3 bg-muted/10 p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Resumen de Pago</h3>
                    <div className="flex justify-between text-sm">
                        <span>Salario Quincenal</span>
                        <div className="flex items-center gap-6">
                            <span>{formatCurrency(salarioQuincenal)}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <span>{formatCurrency(registro.netoPagar)}</span>
                        </div>
                        <span>Neto a Pagar</span>
                    </div>
                    <Progress value={porcentajeNeto} className="h-2.5" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Deducciones: {formatCurrency(totalDeducciones)}</span>
                        <span>{porcentajeNeto.toFixed(1)}% de la quincena</span>
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 w-full"
                    onClick={() => setDetallesExpanded(!detallesExpanded)}
                >
                    {detallesExpanded ? (
                        <>
                            <ChevronUp className="h-4 w-4" />
                            Ocultar detalles de deducciones
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-4 w-4" />
                            Ver detalles de deducciones
                        </>
                    )}
                </Button>

                {detallesExpanded && (
                    <div className="space-y-4">
                        <Separator />
                        <div>
                            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                                <PieChart className="h-4 w-4 text-primary" />
                                Desglose de Deducciones
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {registro.detalles.map((detalle) => (
                                            <TableRow key={detalle.id}>
                                                <TableCell>{detalle.tipoDeduccionNombre}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(detalle.monto)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell className="font-bold">Total</TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatCurrency(totalDeducciones)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium">Distribución de Deducciones</h4>
                                    {registro.detalles.map((detalle) => {
                                        const porcentajeDet = (detalle.monto / totalDeducciones) * 100;
                                        return (
                                            <div key={detalle.id} className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span>{detalle.tipoDeduccionNombre}</span>
                                                    <span>{formatCurrency(detalle.monto)}</span>
                                                </div>
                                                <Progress value={porcentajeDet} className="h-2" />
                                                <div className="text-xs text-muted-foreground text-right">
                                                    {porcentajeDet.toFixed(1)}% de deducciones
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="bg-muted/10 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    ID Empleado: {registro.empleadoId}
                </div>
                <div className="flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    ID Pago: {registro.id}
                </div>
            </CardFooter>
        </Card>
    );
}
