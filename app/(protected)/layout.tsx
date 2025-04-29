import { getSession } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { redirect } from "next/navigation";



export default async function Layout({ children }: { children: React.ReactNode }) {


  const sesion = await getSession();

  if (!sesion) {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full p-2">
        <SidebarTrigger />
        {children}
        <Toaster />
      </main>
    </SidebarProvider>
  );
}
