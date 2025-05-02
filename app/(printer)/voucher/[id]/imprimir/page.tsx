
import { getVoucherPagoId } from "@/app/(protected)/voucher-pago/actions";
import { Inbox } from "lucide-react";
import { PayrollPrintLayout } from "./voucher";


export default async function ImprimirPage({ params }: { params: { id: string } }) {
    const solicitud = await getVoucherPagoId(params.id);
    if (!solicitud) {
        return (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
                <Inbox size={50} color="red" />
                <p>No se encuentra la solicitud</p>
            </div>
        );
    }

    return <PayrollPrintLayout registro={solicitud} companyName="Medio Publicitarios S.A" />;
}
