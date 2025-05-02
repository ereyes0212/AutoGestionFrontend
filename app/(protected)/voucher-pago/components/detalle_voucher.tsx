"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
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
} from "lucide-react"
import { useState } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { RegistroPago } from "../type"

interface PayrollCardProps {
    registro: RegistroPago
}

export function PayrollCard({ registro }: PayrollCardProps) {
    const [detallesExpanded, setDetallesExpanded] = useState(false)

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("es-HN", {
            style: "currency",
            currency: "HNL",
        }).format(amount)

    const formatDate = (dateString: string) => format(new Date(dateString), "dd 'de' MMMM, yyyy", { locale: es })

    // Calcular salario quincenal y porcentaje sobre quincena
    const salarioQuincenal = registro.salarioMensual / 2
    const porcentajeNeto = (registro.netoPagar / salarioQuincenal) * 100
    const totalDeducciones = registro.detalles.reduce((sum, d) => sum + d.monto, 0)

    const getInitials = (name: string) =>
        name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()

    const handlePrint = () => {
        window.open(`/voucher/${registro.id}/imprimir`, "_blank")
    }

    return (
        <Card className="shadow-md w-full max-w-full overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-6 px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-primary/20 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-lg sm:text-xl">
                                {getInitials(registro.empleadoNombre)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg sm:text-xl break-words">{registro.empleadoNombre}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1 text-xs sm:text-sm">
                                <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">{registro.empleadoPuesto}</span>
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end w-full sm:w-auto mt-4 sm:mt-0">
                        <Badge
                            variant={registro.observaciones ? "outline" : "secondary"}
                            className="flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 text-xs"
                        >
                            {registro.observaciones ? (
                                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                            ) : (
                                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 flex-shrink-0" />
                            )}
                            <span className="truncate">{registro.observaciones || "Sin observaciones"}</span>
                        </Badge>
                        <span className="text-xs sm:text-sm text-muted-foreground mt-2 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            {formatDate(registro.fechaPago)}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-xs sm:text-sm w-full sm:w-auto"
                            onClick={handlePrint}
                        >
                            Imprimir
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6 px-4 sm:px-6">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
                    <div className="bg-muted/20 p-2 sm:p-3 rounded-lg">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                            Días Trabajados
                        </span>
                        <span className="text-base sm:text-lg font-semibold">{registro.diasTrabajados}</span>
                    </div>

                    <div className="bg-muted/20 p-2 sm:p-3 rounded-lg">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                            Salario Diario
                        </span>
                        <span className="text-base sm:text-lg font-semibold">{formatCurrency(registro.salarioDiario)}</span>
                    </div>

                    <div className="bg-muted/20 p-2 sm:p-3 rounded-lg">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                            Salario Mensual
                        </span>
                        <span className="text-base sm:text-lg font-semibold">{formatCurrency(registro.salarioMensual)}</span>
                    </div>

                    <div className="bg-primary/10 p-2 sm:p-3 rounded-lg">
                        <span className="text-xs text-primary/80 flex items-center gap-1 mb-1">
                            <CreditCard className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                            Neto a Pagar
                        </span>
                        <span className="text-base sm:text-lg font-semibold text-primary">
                            {formatCurrency(registro.netoPagar)}
                        </span>
                    </div>
                </div>

                <div className="space-y-3 bg-muted/10 p-3 sm:p-4 rounded-lg">
                    <h3 className="text-xs sm:text-sm font-medium mb-2">Resumen de Pago</h3>
                    <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm gap-2 sm:gap-0">
                        <span>Salario Quincenal</span>
                        <div className="flex items-center gap-2 sm:gap-6">
                            <span>{formatCurrency(salarioQuincenal)}</span>
                            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground hidden sm:inline" />
                            <span>{formatCurrency(registro.netoPagar)}</span>
                        </div>
                        <span>Neto a Pagar</span>
                    </div>
                    <Progress value={porcentajeNeto} className="h-2 sm:h-2.5" />
                    <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-muted-foreground gap-1 sm:gap-0">
                        <span>Deducciones: {formatCurrency(totalDeducciones)}</span>
                        <span>{porcentajeNeto.toFixed(1)}% de la quincena</span>
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 w-full text-xs sm:text-sm"
                    onClick={() => setDetallesExpanded(!detallesExpanded)}
                >
                    {detallesExpanded ? (
                        <>
                            <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            Ocultar detalles de deducciones
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            Ver detalles de deducciones
                        </>
                    )}
                </Button>

                {detallesExpanded && (
                    <div className="space-y-4">
                        <Separator />
                        <div>
                            <h3 className="text-xs sm:text-sm font-medium flex items-center gap-2 mb-3">
                                <PieChart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                                Desglose de Deducciones
                            </h3>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="overflow-x-auto -mx-4 sm:mx-0">
                                    <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                                        <Table className="min-w-full">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-xs sm:text-sm">Tipo</TableHead>
                                                    <TableHead className="text-right text-xs sm:text-sm">Monto</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {registro.detalles.map((detalle) => (
                                                    <TableRow key={detalle.id}>
                                                        <TableCell className="text-xs sm:text-sm">{detalle.tipoDeduccionNombre}</TableCell>
                                                        <TableCell className="text-right font-medium text-xs sm:text-sm">
                                                            {formatCurrency(detalle.monto)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow>
                                                    <TableCell className="font-bold text-xs sm:text-sm">Total</TableCell>
                                                    <TableCell className="text-right font-bold text-xs sm:text-sm">
                                                        {formatCurrency(totalDeducciones)}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                <div className="space-y-4 mt-4">
                                    <h4 className="text-xs sm:text-sm font-medium">Distribución de Deducciones</h4>
                                    {registro.detalles.map((detalle) => {
                                        const porcentajeDet = (detalle.monto / totalDeducciones) * 100
                                        return (
                                            <div key={detalle.id} className="space-y-1">
                                                <div className="flex justify-between text-xs sm:text-sm">
                                                    <span className="truncate mr-2">{detalle.tipoDeduccionNombre}</span>
                                                    <span className="flex-shrink-0">{formatCurrency(detalle.monto)}</span>
                                                </div>
                                                <Progress value={porcentajeDet} className="h-1.5 sm:h-2" />
                                                <div className="text-xs text-muted-foreground text-right">
                                                    {porcentajeDet.toFixed(1)}% de deducciones
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="bg-muted/10 text-xs text-muted-foreground flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center gap-1">
                    <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                    ID Empleado: {registro.empleadoId}
                </div>
                <div className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                    ID Pago: {registro.id}
                </div>
            </CardFooter>
        </Card>
    )
}
