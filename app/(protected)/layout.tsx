// app/layout.tsx (o el archivo que contiene tu Layout)
import { getSession } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { redirect } from "next/navigation";
import ClientProviders from "../components/ClientProivders";
// import PushRegistrar si la querés fuera del ClientProviders (no necesario si lo incluiste allí)

export default async function Layout({ children }: { children: React.ReactNode }) {
  const sesion = await getSession();

  if (!sesion) {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      {/* ClientProviders es un componente CLIENT que montará PushRegistrar y SocketNotifier */}
      <ClientProviders
        empleadoId={sesion!.IdEmpleado}
        currentUserId={String(sesion!.IdUser)}
      // getActiveConversationId={...} // opcional: pasá función si querés evitar notifs cuando el usuario está viendo la charla
      >
        <main className="w-full p-2">
          <SidebarTrigger />
          {children}
          <Toaster />
        </main>
      </ClientProviders>
    </SidebarProvider>
  );
}
