import { getSessionUsuario } from "@/auth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Calculator, ChevronDown, ChevronUp, File, FileCheck2, Files, LayersIcon, ListOrderedIcon, LucideFilePen, Settings, UserIcon, UserRoundCheck, UsersIcon } from 'lucide-react';
import Link from "next/link";
import ToggleThemeButton from "../components/button-theme";
import { NavUser } from "./nav-user";

// Menú de mantenimiento
const mantenimientoItems = [
  {
    title: "Roles",
    url: "/roles",
    icon: LayersIcon,
    permiso: "ver_roles",
  },
  {
    title: "Permisos",
    url: "/permisos",
    icon: LayersIcon,
    permiso: "ver_permisos",
  },
  {
    title: "Usuarios",
    url: "/usuarios",
    icon: UserIcon,
    permiso: "ver_usuarios",
  },
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
    title: "Configuración",
    url: "/configuracion-permisos",
    icon: Settings,
    permiso: "ver_usuarios",
  },
];

const DiseñoGraficoItem = [
  {
    title: "Tipos de Sección",
    url: "/tipo-seccion",
    icon: ListOrderedIcon,
    permiso: "ver_tipo_seccion",
  },
  {
    title: "Reporte Diseño",
    url: "/reporte-diseno",
    icon: LucideFilePen,
    permiso: "ver_reporte_diseno",
  },
]


// Menu items con permisos necesarios (sin los items de mantenimiento)
const items = [

  {
    title: "Solicitudes",
    url: "/solicitudes",
    icon: Files,
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

  // Filtrar los ítems de mantenimiento basados en los permisos del usuario
  const filteredMantenimientoItems = mantenimientoItems.filter(item =>
    permisosUsuario.includes(item.permiso)
  );
  const filteredDiseñoItems = DiseñoGraficoItem.filter(item =>
    permisosUsuario.includes(item.permiso)
  );

  // Solo mostrar la sección de mantenimiento si hay al menos un ítem con permiso
  const showMantenimiento = filteredMantenimientoItems.length > 0;
  const showDiseño = filteredDiseñoItems.length > 0;

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
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {showMantenimiento && (
                <Collapsible className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <Settings size={16} className="p-0" />
                        <span>Mantenimiento</span>
                        <ChevronDown className="ml-auto group-data-[state=open]/collapsible:hidden" />
                        <ChevronUp className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {filteredMantenimientoItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <Link href={item.url}>
                                {item.title}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {showDiseño && (
                <Collapsible className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild >
                      <SidebarMenuButton>
                        <FileCheck2 size={16} className="p-0" />
                        <span>Reportes Diseño</span>
                        <ChevronDown className="ml-auto group-data-[state=open]/collapsible:hidden" />
                        <ChevronUp className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {DiseñoGraficoItem.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <Link href={item.url}>
                                {item.title}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {usuario && <NavUser usuario={usuario} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}