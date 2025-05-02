
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { DollarSign } from "lucide-react";
import { redirect } from "next/navigation";
import { getVoucherPagoId } from "../../actions";
import { PayrollCard } from "../../components/detalle_voucher";

export default async function Edit({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_detalle_voucher_pago")) {
    return <NoAcceso />;
  }



  // Obtener el cliente por su ID
  const voucher = await getVoucherPagoId(params.id);
  if (!voucher) {
    redirect("/voucher-pago"); // Redirige si no se encuentra el cliente
  }


  return (
    <div>
      <HeaderComponent
        Icon={DollarSign}
        description="En este apartado podrá ver detalle de su pago"
        screenName="Detalle de pago"
      />
      <PayrollCard registro={voucher} />
    </div>
  );
}
