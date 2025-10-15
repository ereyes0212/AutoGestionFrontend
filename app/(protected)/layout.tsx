// app/layout.tsx
import { getSession } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import ChatDock from "@/components/ChatDock";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { redirect } from "next/navigation";
import ClientProviders from "../components/ClientProivders";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const sesion = await getSession();

  if (!sesion) {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <ClientProviders
        empleadoId={sesion!.IdEmpleado}
        currentUserId={String(sesion!.IdUser)}
      >
        <main className="w-full p-2">
          <SidebarTrigger />
          {children}
          <Toaster />
        </main>

        {/* ChatDock recibe currentUserId */}
        <ChatDock currentUserId={String(sesion!.IdUser)} />
      </ClientProviders>
    </SidebarProvider>
  );
}
