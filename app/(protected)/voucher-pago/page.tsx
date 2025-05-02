import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Users } from "lucide-react";
import { getVoucherPagos } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";

export default async function Empleados() {


  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_voucher_pago")) {
    return <NoAcceso />;
  }

  const data = await getVoucherPagos();



  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={Users}
        description="En este apartado podrá ver todos los empleados"
        screenName="Empleados"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      {/* <div className="block md:hidden">
        <EmployeeListMobile empleados={data} />
      </div> */}
    </div>
  );
}
