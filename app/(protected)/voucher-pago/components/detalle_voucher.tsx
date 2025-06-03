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
    Minus,
    PieChart,
    Plus,
    TrendingDown,
    TrendingUp,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RegistroPago } from "../type"


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

    // Separar deducciones y bonos
    const deducciones = registro.detalles.filter((d) => d.categoria === "DEDUCCION")
    const bonos = registro.detalles.filter((d) => d.categoria === "BONO")

    // Calcular totales
    const totalDeducciones = deducciones.reduce((sum, d) => sum + d.monto, 0)
    const totalBonos = bonos.reduce((sum, b) => sum + b.monto, 0)

    // Calcular salario quincenal y porcentaje sobre quincena
    const salarioQuincenal = registro.salarioMensual / 2
    const porcentajeNeto = (registro.netoPagar / salarioQuincenal) * 100

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

                {/* Resumen mejorado con bonos y deducciones */}
                <div className="space-y-4 bg-muted/10 p-3 sm:p-4 rounded-lg">
                    <h3 className="text-xs sm:text-sm font-medium mb-2">Resumen de Pago</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-primary/10 p-3 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Plus className="h-3.5 w-3.5 text-green-600" />
                                <span className="text-xs font-medium text-muted-foreground">Bonos</span>
                            </div>
                            <span className="text-sm font-semibold ">
                                {totalBonos > 0 ? formatCurrency(totalBonos) : "Sin bonos"}
                            </span>
                        </div>

                        <div className="bg-primary/10 p-3 rounded-lg border border-red-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Minus className="h-3.5 w-3.5 text-red-600" />
                                <span className="text-xs font-medium text-muted-foreground">Deducciones</span>
                            </div>
                            <span className="text-sm font-semibold ">
                                {totalDeducciones > 0 ? formatCurrency(totalDeducciones) : "Sin deducciones"}
                            </span>
                        </div>

                        <div className="bg-primary/10 p-3 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-1">
                                <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                                <span className="text-xs font-medium text-muted-foreground">Neto Final</span>
                            </div>
                            <span className="text-sm font-semibold ">{formatCurrency(registro.netoPagar)}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm gap-2 sm:gap-0">
                        <span>Salario Quincenal</span>
                        <div className="flex items-center gap-2 sm:gap-6">
                            <span>{formatCurrency(salarioQuincenal)}</span>
                            {totalBonos > 0 && (
                                <>
                                    <Plus className="h-3 w-3 text-green-600" />
                                    <span className="text-green-600">{formatCurrency(totalBonos)}</span>
                                </>
                            )}
                            {totalDeducciones > 0 && (
                                <>
                                    <Minus className="h-3 w-3 text-red-600" />
                                    <span className="text-red-600">{formatCurrency(totalDeducciones)}</span>
                                </>
                            )}
                            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground hidden sm:inline" />
                            <span className="font-semibold">{formatCurrency(registro.netoPagar)}</span>
                        </div>
                    </div>
                    <Progress value={porcentajeNeto} className="h-2 sm:h-2.5" />
                    <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-muted-foreground gap-1 sm:gap-0">
                        <span>
                            {totalBonos > 0 && totalDeducciones > 0
                                ? `Bonos: ${formatCurrency(totalBonos)} | Deducciones: ${formatCurrency(totalDeducciones)}`
                                : totalBonos > 0
                                    ? `Bonos: ${formatCurrency(totalBonos)}`
                                    : `Deducciones: ${formatCurrency(totalDeducciones)}`}
                        </span>
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
                            Ocultar detalles
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            Ver detalles de bonos y deducciones
                        </>
                    )}
                </Button>

                {detallesExpanded && (
                    <div className="space-y-4">
                        <Separator />
                        <div>
                            <h3 className="text-xs sm:text-sm font-medium flex items-center gap-2 mb-3">
                                <PieChart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                                Desglose Detallado
                            </h3>

                            <Tabs defaultValue={bonos.length > 0 ? "bonos" : "deducciones"} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="bonos" className="flex items-center gap-2">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                        Bonos ({bonos.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="deducciones" className="flex items-center gap-2">
                                        <TrendingDown className="h-3.5 w-3.5" />
                                        Deducciones ({deducciones.length})
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="bonos" className="space-y-4">
                                    {bonos.length > 0 ? (
                                        <>
                                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                                                    <Table className="min-w-full">
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="text-xs sm:text-sm">Concepto</TableHead>
                                                                <TableHead className="text-right text-xs sm:text-sm">Monto</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {bonos.map((bono) => (
                                                                <TableRow key={bono.id}>
                                                                    <TableCell className="text-xs sm:text-sm">{bono.tipoDeduccionNombre}</TableCell>
                                                                    <TableCell className="text-right font-medium text-xs sm:text-sm text-green-600">
                                                                        +{formatCurrency(bono.monto)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                            <TableRow>
                                                                <TableCell className="font-bold text-xs sm:text-sm">Total Bonos</TableCell>
                                                                <TableCell className="text-right font-bold text-xs sm:text-sm text-green-600">
                                                                    +{formatCurrency(totalBonos)}
                                                                </TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>

                                            <div className="space-y-4 mt-4">
                                                <h4 className="text-xs sm:text-sm font-medium">Distribución de Bonos</h4>
                                                {bonos.map((bono) => {
                                                    const porcentajeBono = totalBonos > 0 ? (bono.monto / totalBonos) * 100 : 0
                                                    return (
                                                        <div key={bono.id} className="space-y-1">
                                                            <div className="flex justify-between text-xs sm:text-sm">
                                                                <span className="truncate mr-2">{bono.tipoDeduccionNombre}</span>
                                                                <span className="flex-shrink-0 text-green-600">+{formatCurrency(bono.monto)}</span>
                                                            </div>
                                                            <Progress value={porcentajeBono} className="h-1.5 sm:h-2" />
                                                            <div className="text-xs text-muted-foreground text-right">
                                                                {porcentajeBono.toFixed(1)}% de bonos
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No hay bonos registrados para este período</p>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="deducciones" className="space-y-4">
                                    {deducciones.length > 0 ? (
                                        <>
                                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                                                    <Table className="min-w-full">
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="text-xs sm:text-sm">Concepto</TableHead>
                                                                <TableHead className="text-right text-xs sm:text-sm">Monto</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {deducciones.map((deduccion) => (
                                                                <TableRow key={deduccion.id}>
                                                                    <TableCell className="text-xs sm:text-sm">{deduccion.tipoDeduccionNombre}</TableCell>
                                                                    <TableCell className="text-right font-medium text-xs sm:text-sm text-red-600">
                                                                        -{formatCurrency(deduccion.monto)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                            <TableRow>
                                                                <TableCell className="font-bold text-xs sm:text-sm">Total Deducciones</TableCell>
                                                                <TableCell className="text-right font-bold text-xs sm:text-sm text-red-600">
                                                                    -{formatCurrency(totalDeducciones)}
                                                                </TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>

                                            <div className="space-y-4 mt-4">
                                                <h4 className="text-xs sm:text-sm font-medium">Distribución de Deducciones</h4>
                                                {deducciones.map((deduccion) => {
                                                    const porcentajeDed = totalDeducciones > 0 ? (deduccion.monto / totalDeducciones) * 100 : 0
                                                    return (
                                                        <div key={deduccion.id} className="space-y-1">
                                                            <div className="flex justify-between text-xs sm:text-sm">
                                                                <span className="truncate mr-2">{deduccion.tipoDeduccionNombre}</span>
                                                                <span className="flex-shrink-0 text-red-600">-{formatCurrency(deduccion.monto)}</span>
                                                            </div>
                                                            <Progress value={porcentajeDed} className="h-1.5 sm:h-2" />
                                                            <div className="text-xs text-muted-foreground text-right">
                                                                {porcentajeDed.toFixed(1)}% de deducciones
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <TrendingDown className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No hay deducciones registradas para este período</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
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
