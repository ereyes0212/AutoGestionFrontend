import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { MailCheck } from "lucide-react";
import { getVoucherEmailJobs } from "../actions";
import { EmailJobsClient } from "./EmailJobsClient";

export default async function VoucherEmailJobsPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_generar_planilla")) {
    return <NoAcceso />;
  }

  const jobs = await getVoucherEmailJobs();

  return (
    <div className="container mx-auto space-y-6 py-2">
      <HeaderComponent
        Icon={MailCheck}
        description="Revise los correos de vouchers pendientes, en envío, enviados o con error."
        screenName="Envío de emails de planilla"
      />
      <EmailJobsClient initialJobs={jobs} />
    </div>
  );
}
