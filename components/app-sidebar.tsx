
import {
  BookTextIcon,
  Car,
  ChartSplineIcon,
  Home,
  House,
  LayersIcon,
  List,
  ListCheck,
  ListChecks,
  NotebookText,
  Package,
  StepForward,
  TornadoIcon,
  User,
  UserIcon,
  UserRoundCheck,
  Users2,
  UsersIcon,
} from "lucide-react";
// import { getSessionUsuario } from "@/auth"; // Asegúrate de que esta función exista y retorne el nombre del usuario
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
import ToggleThemeButton from "../components/button-theme";
import Link from "next/link";
import { NavUser } from "./nav-user";
import { getSessionUsuario } from "@/auth";
// import { BookTextIcon } from "./ui/book-text";
// import { UsersIcon } from "./ui/users";
// import { ChartSplineIcon } from "./ui/chart-spline";
// import { BoxesIcon } from "./ui/boxes";
// import { UserIcon } from "./ui/user";
// import { LayersIcon } from "./ui/layers";
// import { PlayIcon } from "./ui/play";
// import { TornadoIcon } from "./ui/tornado";

// Menu items con permisos necesarios
const items = [
  {
    title: "Empleados",
    url: "/empleados",
    icon: UsersIcon,
    permiso: "ver_empleados",
  },
  {
    title: "Empresas",
    url: "/empresas",
    icon: House,
    permiso: "ver_empresas",
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
            <span>Sistema Carwash</span>
            
            <ToggleThemeButton />
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon size={16} className="p-0"/>
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
