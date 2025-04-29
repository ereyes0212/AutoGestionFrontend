import {  User } from "lucide-react";
import {  getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import EmployeeProfile from "./components/empleado-perfil";
import { getProfile } from "./actions";

export default async function EstadoServicio() {

    const permisos = await getSessionPermisos();



    if (!permisos?.includes("ver_permisos")) {
        return <NoAcceso />;
    }

    const employeeData = await getProfile();
    if (!employeeData) {
        return <NoAcceso />;
    }
    return (
        <div className="container mx-auto py-2">
            <HeaderComponent
                Icon={User}
                description="En este apartado podrá tu perfil, asi como ver tus solicitudes."
                screenName="Perfil"
            />

            <EmployeeProfile employee={employeeData!} />
            {/* 

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <PermissionListMobile permisos={data} />
      </div> */}
        </div>
    );
}
