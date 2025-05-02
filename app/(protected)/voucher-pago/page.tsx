import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { FileSpreadsheetIcon } from "lucide-react";
import { getVoucherPagos } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import PayrollListMobile from "./components/vouchers-list-mobile";

export default async function Empleados() {


  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_voucher_pago")) {
    return <NoAcceso />;
  }

  const data = await getVoucherPagos();



  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={FileSpreadsheetIcon}
        description="En este apartado podrá ver todos sus voucher de pago."
        screenName="Vouchers de pago"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <PayrollListMobile registros={data} />
      </div>
    </div>
  );
}
