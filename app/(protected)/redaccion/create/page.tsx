import { getSession, getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { NotaFormulario } from "../components/Form";

function isWithinWindowHonduras(date: Date, startHour: number, endHour: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Tegucigalpa",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);

  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  const totalMinutes = hour * 60 + minute;
  const start = startHour * 60;
  const end = endHour * 60 + 59; // incluye minuto 59

  if (start <= end) {
    return totalMinutes >= start && totalMinutes <= end;
  } else {
    // si la ventana cruza medianoche (no es el caso aquí, pero queda preparado)
    return totalMinutes >= start || totalMinutes <= end;
  }
}

export default async function Create(): Promise<JSX.Element> {
  const session = await getSession();
  const permisos = await getSessionPermisos();

  // Ventana permitida: 06:00 - 23:59 (Honduras)
  const startHour = 6;
  const endHour = 23;
  const now = new Date();
  const withinWindow = isWithinWindowHonduras(now, startHour, endHour);

  if (!session) return <NoAcceso />;
  if (!permisos?.includes("crear_notas")) return <NoAcceso />;

  if (!withinWindow) {
    // obtener hora local en Honduras en formato 12h
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Tegucigalpa",
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(now);
    const hourStr = parts.find((p) => p.type === "hour")?.value ?? "00";
    const minuteStr = parts.find((p) => p.type === "minute")?.value ?? "00";
    const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value ?? "";
    const formatted = `${hourStr}:${minuteStr} ${dayPeriod.toLowerCase()}`;

    return (
      <>
        <NoAcceso />
        <div style={{ textAlign: "center", padding: 16 }}>
          <p>
            Esta página sólo está disponible entre las <strong>{startHour}</strong> y las <strong>{endHour}</strong>.
          </p>
          <p>
            Hora actual: <strong>{formatted}</strong>
          </p>
        </div>
      </>
    );
  }

  const initialData = {
    id: "",
    titulo: "",
    descripcion: "",
    estado: "PENDIENTE" as const,
    creadorEmpleadoId: session?.IdEmpleado || "",
    asignadoEmpleadoId: null,
    aprobadorEmpleadoId: null,
  };

  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="En este apartado podrá crear una nota."
        screenName="Crear Nota"
      />
      <NotaFormulario
        permiso=""
        isUpdate={false}
        initialData={initialData}
        currentUserEmpleadoId={session?.IdEmpleado || ""}
      />
    </div>
  );
}
