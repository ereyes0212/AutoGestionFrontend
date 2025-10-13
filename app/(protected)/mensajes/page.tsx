import { getSession, getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { MessagesSquare } from "lucide-react";
import { getUsuarios } from "../usuarios/actions";
import { getChatsForUser } from "./actions";
import ChatListClient from "./components/chatsList";
import NewChatDialog from "./components/dialognewChat";
import NewGroupChatDialog from "./components/dialognewChatGroup";

export default async function EstadoServicio() {
    const permisos = await getSessionPermisos();
    const session = await getSession();

    if (!permisos!.includes("ver_mensajes")) {
        return <NoAcceso />;
    }
    let usuarios = await getUsuarios()
    usuarios = usuarios.filter((u) => u.id != session?.IdUser!);
    const data = await getChatsForUser(session?.IdUser || "");

    return (
        <div className="container mx-auto py-2">
            <HeaderComponent
                Icon={MessagesSquare}
                description="En este apartado podrá ver todos los grupos de mensajes"
                screenName="Mensajes"
            />

            <div className="flex justify-end mb-2 space-x-4">
                <NewChatDialog
                    usuarios={usuarios}
                    idUsuarioCreador={session?.IdUser!}
                />
                {permisos!.includes("crear_grupo") &&

                    <NewGroupChatDialog
                        usuarios={usuarios}
                        idUsuarioCreador={session?.IdUser!}
                    />
                }
            </div>

            <ChatListClient chats={data} currentUserId={session?.IdUser!} />
        </div>
    );
}
