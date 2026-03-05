"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FiltrosFacturas({ empleados }: { empleados: { id: string; nombre: string; apellido: string }[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const aplicar = (formData: FormData) => {
    const params = new URLSearchParams(searchParams.toString());
    ["desde", "hasta", "empleadoId"].forEach((k) => params.delete(k));

    const desde = String(formData.get("desde") || "");
    const hasta = String(formData.get("hasta") || "");
    const empleadoId = String(formData.get("empleadoId") || "");

    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (empleadoId && empleadoId !== "all") params.set("empleadoId", empleadoId);

    router.push(`/facturas?${params.toString()}`);
  };

  const imprimir = () => {
    const params = new URLSearchParams(searchParams.toString());
    const query = params.toString();
    const url = query ? `/api/facturas/reporte?${query}` : "/api/facturas/reporte";
    window.open(url, "_blank");
  };

  return (
    <form action={aplicar} className="grid grid-cols-1 md:grid-cols-5 gap-3 border rounded-md p-3">
      <div>
        <Label>Desde</Label>
        <Input name="desde" type="date" defaultValue={searchParams.get("desde") || ""} />
      </div>
      <div>
        <Label>Hasta</Label>
        <Input name="hasta" type="date" defaultValue={searchParams.get("hasta") || ""} />
      </div>
      <div>
        <Label>Empleado</Label>
        <select
          name="empleadoId"
          defaultValue={searchParams.get("empleadoId") || "all"}
          className="w-full h-10 rounded-md border bg-background px-3"
        >
          <option value="all">Todos</option>
          {empleados.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.nombre} {emp.apellido}</option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <Button type="submit" className="w-full">Filtrar</Button>
      </div>
      <div className="flex items-end">
        <Button type="button" variant="secondary" className="w-full" onClick={imprimir}>
          Imprimir PDF
        </Button>
      </div>
    </form>
  );
}
