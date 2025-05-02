
import { getSessionUsuario } from "@/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Calculator, File, Files, LayersIcon, Settings, UserIcon, UserRoundCheck, UsersIcon } from "lucide-react";
import Link from "next/link";
import ToggleThemeButton from "../components/button-theme";
import { NavUser } from "./nav-user";


// Menu items con permisos necesarios
const items = [
  {
    title: "Empleados",
    url: "/empleados",
    icon: UsersIcon,
    permiso: "ver_empleados",
  },
  {
    title: "Puestos",
    url: "/puestos",
    icon: UserRoundCheck,
    permiso: "ver_puestos",
  },
  {
    title: "Permisos",
    url: "/permisos",
    icon: LayersIcon,
    permiso: "ver_permisos",
  },
  {
    title: "Roles",
    url: "/roles",
    icon: LayersIcon,
    permiso: "ver_roles",
  },
  {
    title: "Usuarios",
    url: "/usuarios",
    icon: UserIcon,
    permiso: "ver_usuarios",
  },
  {
    title: "Solicitudes",
    url: "/solicitudes",
    icon: Files,
    permiso: "ver_usuarios",
  },
  {
    title: "Configuración",
    url: "/configuracion-permisos",
    icon: Settings,
    permiso: "ver_usuarios",
  },
  {
    title: "Contabilidad",
    url: "/contabilidad",
    icon: Calculator,
    permiso: "ver_contabilidad",
  },
  {
    title: "Voucher de Pago",
    url: "/voucher-pago",
    icon: File,
    permiso: "ver_voucher_pago",
  }

];

export async function AppSidebar() {
  const usuario = await getSessionUsuario(); // Obtiene el nombre del usuario
  const permisosUsuario = usuario?.Permiso || [];
  // Filtrar los ítems basados en los permisos del usuario
  const filteredItems = items.filter(item =>
    permisosUsuario.includes(item.permiso)
  );
  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex justify-between items-center">
            <span>Sistema Autogestión MP</span>

            <ToggleThemeButton />
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon size={16} className="p-0" />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {usuario && <NavUser usuario={usuario} />}
      </SidebarFooter>
    </Sidebar>
  );
}
