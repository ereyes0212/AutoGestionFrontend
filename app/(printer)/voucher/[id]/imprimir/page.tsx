
import { getVoucherPagoId } from "@/app/(protected)/voucher-pago/actions";
import { Inbox } from "lucide-react";
import VoucherPrintView from "./voucher";


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

    return <VoucherPrintView registro={solicitud} />;
}
