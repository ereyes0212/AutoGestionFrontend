import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Card, CardContent } from "@/components/ui/card";
import {
    Building2,
    ClipboardList,
    FileBarChart,
    History,
    List,
    LucideIcon,
    Package,
    Ruler,
    ShoppingBasket,
} from "lucide-react";
import Link from "next/link";

type ModuloInventario = {
    titulo: string;
    descripcion: string;
    url: string;
    Icon: LucideIcon;
    color: string;
};

const modulos: ModuloInventario[] = [
    {
        titulo: "Categorias de activos",
        descripcion: "Administre los diferentes tipos de categorias de activos.",
        url: "/inventario/categoria-activo",
        Icon: List,
        color: "text-blue-500",
    },
    {
        titulo: "Estados activo",
        descripcion: "Administre los diferentes tipos de estado de un activo.",
        url: "/inventario/estados-activos",
        Icon: List,
        color: "text-green-500",
    },
    {
        titulo: "Activos",
        descripcion: "Administre los diferentes activos.",
        url: "/inventario/activo",
        Icon: Package,
        color: "text-green-500",
    },
    {
        titulo: "Ciudades",
        descripcion: "Bodegas donde se lleva inventario de insumos.",
        url: "/inventario/ciudades",
        Icon: Building2,
        color: "text-blue-500",
    },
    {
        titulo: "Unidades de medida",
        descripcion: "Unidades de los insumos: caja, unidad, bote, etc.",
        url: "/inventario/unidad-insumo",
        Icon: Ruler,
        color: "text-blue-500",
    },
    {
        titulo: "Insumos",
        descripcion: "Administre los productos consumibles y su stock.",
        url: "/inventario/insumos",
        Icon: ShoppingBasket,
        color: "text-green-500",
    },
    {
        titulo: "Pedidos de insumos",
        descripcion: "Genere pedidos de compra y reciba el producto al llegar.",
        url: "/inventario/insumos/pedidos",
        Icon: ClipboardList,
        color: "text-green-500",
    },
    {
        titulo: "Movimientos de insumos",
        descripcion: "Consulte las entradas y salidas de insumos y sus firmas.",
        url: "/inventario/insumos/movimientos",
        Icon: History,
        color: "text-blue-500",
    },
    {
        titulo: "Reportes de insumos",
        descripcion: "Reportes por fecha, por producto o el general de existencias.",
        url: "/inventario/insumos/reportes",
        Icon: FileBarChart,
        color: "text-green-500",
    },
];

export default async function Inventario() {
    const permisos = await getSessionPermisos();

    if (!permisos?.includes("ver_inventario")) {
        return <NoAcceso />;
    }

    return (
        <div className="container mx-auto py-2">
            <HeaderComponent
                Icon={Package}
                description="En este apartado podrá ver todos las diferentes opciones de inventario"
                screenName="inventario"
            />

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {modulos.map(({ titulo, descripcion, url, Icon, color }) => (
                    <Link key={url} href={url} className="h-full">
                        <Card className="h-full shadow-sm transition hover:bg-secondary hover:shadow-md">
                            <CardContent className="flex h-full flex-col gap-2 p-5">
                                <Icon className={`h-8 w-8 ${color}`} />
                                <h3 className="text-base font-semibold">{titulo}</h3>
                                <p className="text-sm text-muted-foreground">{descripcion}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
