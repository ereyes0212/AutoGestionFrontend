import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Building2, Mail } from "lucide-react"
import { Employee } from "../type"

interface EmployeeProfileProps {
    employee: Employee
}

export default function EmployeeProfile({ employee }: EmployeeProfileProps) {
    // Get initials for avatar
    const initials = `${employee.nombre.charAt(0)}${employee.apellido.charAt(0)}`

    return (
        <Card className="w-full">
            <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold">
                                {employee.nombre} {employee.apellido}
                            </h2>
                            <Badge variant={employee.activo ? "default" : "outline"}>{employee.activo ? "Activo" : "Inactivo"}</Badge>
                        </div>
                        <p className="text-muted-foreground">{employee.puesto}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="mr-1 h-4 w-4" />
                            {employee.correo}
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

                            <dt className="font-medium text-muted-foreground">Usuario:</dt>
                            <dd>{employee.usuario}</dd>

                            <dt className="font-medium text-muted-foreground">Edad:</dt>
                            <dd>{employee.edad} años</dd>

                            <dt className="font-medium text-muted-foreground">Género:</dt>
                            <dd>{employee.genero}</dd>

                            <dt className="font-medium text-muted-foreground">Jefe:</dt>
                            <dd>{employee.jefe}</dd>
                        </dl>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Empresas</h3>
                        <div className="space-y-2">
                            {employee.empresas.map((company) => (
                                <div key={company.id} className="flex items-center gap-2 rounded-md border p-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span>{company.nombre}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
