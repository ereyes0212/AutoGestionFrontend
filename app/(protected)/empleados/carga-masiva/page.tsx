// app/empleados/page.tsx
"use client";

import HeaderComponent from "@/components/HeaderComponent";
import { Users } from "lucide-react";
import { EmployeeImporter } from "../components/carga-masiva";

export default function Empleados() {
    return (
        <div className="container mx-auto py-4">
            <HeaderComponent
                Icon={Users}
                description="En este apartado podrá ver todos los empleados"
                screenName="Empleados"
            />
            <EmployeeImporter />
        </div>
    );
}
