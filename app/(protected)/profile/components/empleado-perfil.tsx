import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Mail, Phone } from "lucide-react"
import { calcularEdad, calculateYearsOfService } from "../../../../lib/utils"
import type { Employee } from "../type"

interface EmployeeProfileProps {
    employee: Employee
}

export default function EmployeeProfile({ employee }: EmployeeProfileProps) {
    const initials = `${employee.nombre.charAt(0)}${employee.apellido.charAt(0)}`
    const yearsOfService = calculateYearsOfService(new Date(employee.fechaIngreso))

    return (
        <div className=" mx-auto ">
            <Card className="w-full">
                <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-bold">
                                        {employee.nombre} {employee.apellido}
                                    </h2>
                                    <Badge variant={employee.activo ? "default" : "outline"}>
                                        {employee.activo ? "Activo" : "Inactivo"}
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground">{employee.puesto}</p>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Mail className="mr-1 h-4 w-4" />
                                    {employee.correo}
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Phone className="mr-1 h-4 w-4" />
                                    {employee.telefono}
                                </div>
                            </div>
                        </div>

                    </div>
                </CardHeader>

                <Separator />

                <CardContent className="pt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Información Personal</h3>
                            <dl className="grid grid-cols-[1fr_2fr] gap-2 text-sm">
                                <dt className="font-medium text-muted-foreground">Identificación:</dt>
                                <dd>{employee.numeroIdentificacion}</dd>

                                <dt className="font-medium text-muted-foreground">Usuario:</dt>
                                <dd>{employee.usuario}</dd>

                                <dt className="font-medium text-muted-foreground">Edad:</dt>
                                <dd>{calcularEdad(new Date(employee.fechaNacimiento))} años</dd>

                                <dt className="font-medium text-muted-foreground">Género:</dt>
                                <dd>{employee.genero}</dd>

                                <dt className="font-medium text-muted-foreground">Jefe:</dt>
                                <dd>{employee.jefe ? employee.jefe : "Sin Jefe asignado"}</dd>

                                <dt className="font-medium text-muted-foreground">Fecha de Nacimiento:</dt>
                                <dd>
                                    {format(new Date(employee.fechaNacimiento), "dd 'de' MMMM 'de' yyyy", {
                                        locale: es,
                                    })}
                                </dd>

                                <dt className="font-medium text-muted-foreground">Fecha de Ingreso:</dt>
                                <dd>
                                    {format(new Date(employee.fechaIngreso), "dd 'de' MMMM 'de' yyyy", {
                                        locale: es,
                                    })}
                                </dd>

                                <dt className="font-medium text-muted-foreground">Años de Servicio:</dt>
                                <dd>{yearsOfService} años</dd>

                                <dt className="font-medium text-muted-foreground">Vacaciones:</dt>
                                <dd>{employee.vacaciones} días</dd>
                            </dl>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Información de Contacto</h3>
                            <dl className="grid grid-cols-[1fr_2fr] gap-2 text-sm">
                                <dt className="font-medium text-muted-foreground">Teléfono:</dt>
                                <dd>{employee.telefono}</dd>

                                <dt className="font-medium text-muted-foreground">Correo:</dt>
                                <dd>{employee.correo}</dd>

                                <dt className="font-medium text-muted-foreground">Dirección:</dt>
                                <dd>
                                    {employee.colonia}, {employee.ciudadDomicilio}, {employee.departamentoDomicilio}
                                </dd>

                                <dt className="font-medium text-muted-foreground">Profesión:</dt>
                                <dd>{employee.profesion}</dd>

                                {employee.departamentoDomicilio && (
                                    <>
                                        <dt className="font-medium text-muted-foreground">Departamento:</dt>
                                        <dd>{employee.departamentoDomicilio}</dd>
                                    </>
                                )}
                            </dl>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
