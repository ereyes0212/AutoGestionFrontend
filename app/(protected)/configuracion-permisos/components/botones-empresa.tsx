"use client"

import Link from "next/link"
import { Empresa } from "@/lib/Types"
import { Button } from "@/components/ui/button"
import { Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CompanyButtonsProps {
    companies: Empresa[]
}

export default function CompanyButtons({ companies }: CompanyButtonsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {companies.map((company) => (
                <Button
                    asChild
                    variant="ghost"
                    className={cn(
                        "flex items-center justify-start gap-3 p-8 shadow-md border transition-all duration-200 rounded-xl text-left w-full",
                        company.activo
                            ? "bg-primary/10 hover:bg-primary/20 text-primary border-primary"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                >
                    <Link href={`/configuracion-permisos/${company.id}/config`}>
                        <Building2 className="h-5 w-5" />
                        <div>
                            <p className="font-semibold text-base">{company.nombre}</p>
                            <p className="text-xs opacity-70">
                                {company.activo ? "Activa" : "Inactiva"}
                            </p>
                        </div>
                    </Link>
                </Button>

            ))}
        </div>
    )
}
