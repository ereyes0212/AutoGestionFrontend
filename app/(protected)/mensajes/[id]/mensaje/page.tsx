import { getUsuarios } from "@/app/(protected)/usuarios/actions";
import { getSession } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { traerMensajes } from "../../actions";
import { ChatConversation } from "../../components/conversation";

export default async function ConversationPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    const result = await traerMensajes(params.id, session?.IdUser!);
    const usuarios = await getUsuarios();

    if (result.status === "NOT_FOUND") {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <Card className="p-6 text-center shadow-lg rounded-2xl w-full max-w-md">
                    <p className="text-lg font-medium ">❌ La conversación no existe.</p>
                </Card>
            </div>
        );
    }

    if (result.status === "FORBIDDEN") {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <Card className="p-6 text-center shadow-lg rounded-2xl w-full max-w-md">
                    <p className="text-lg font-medium ">🚫 No perteneces a esta conversación.</p>
                </Card>
            </div>
        );
    }

    if (result.status === "ERROR") {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <Card className="p-6 text-center shadow-lg rounded-2xl w-full max-w-md">
                    <p className="text-lg font-medium ">⚠️ Ocurrió un error al cargar los mensajes.</p>
                </Card>
            </div>
        );
    }
    console.log(result.conversacion?.creadorId);
    return (
        <div className="p-4 mx-auto ">
            <HeaderComponent
                Icon={MessageSquare}
                description="En este apartado podrá ver todos los mensajes de la conversación"
                screenName="Mensajes"
            />
            <ChatConversation
                creadorId={result.conversacion?.creadorId || ""}
                nombreActual={result.conversacion?.nombre || ""}
                participantes={((result.conversacion?.participantes || []).map(p => usuarios.find(u => u.id === p.usuarioId)).filter(Boolean) as any)}
                usuarios={usuarios}
                tipo={result.conversacion?.tipo || "private"}


                conversacionId={params.id}
                currentUserId={session?.IdUser!}
                initialMessages={result.mensajes}
            />
        </div>
    );
}
