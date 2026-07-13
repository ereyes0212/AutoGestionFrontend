"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { getVoucherEmailJobs, retryVoucherEmail, VoucherEmailJob } from "../actions";

type Props = { initialJobs: VoucherEmailJob[] };

const statusClass: Record<VoucherEmailJob["estado"], string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  ENVIANDO: "bg-blue-100 text-blue-800",
  ENVIADO: "bg-green-100 text-green-800",
  ERROR: "bg-red-100 text-red-800",
};

export function EmailJobsClient({ initialJobs }: Props) {
  const { toast } = useToast();
  const [jobs, setJobs] = useState(initialJobs);
  const [isPending, startTransition] = useTransition();

  const hasActiveJobs = useMemo(
    () => jobs.some((job) => job.estado === "PENDIENTE" || job.estado === "ENVIANDO"),
    [jobs]
  );

  const refresh = () => {
    startTransition(async () => {
      setJobs(await getVoucherEmailJobs());
    });
  };

  useEffect(() => {
    if (!hasActiveJobs) return;
    const id = window.setInterval(refresh, 5000);
    return () => window.clearInterval(id);
  }, [hasActiveJobs]);

  const handleRetry = (jobId: string) => {
    startTransition(async () => {
      await retryVoucherEmail(jobId);
      setJobs(await getVoucherEmailJobs());
      toast({ title: "Reenvío iniciado", description: "El correo quedó nuevamente en proceso en el servidor." });
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={refresh} disabled={isPending}>
          {isPending ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>Empleado</TableHead>
              <TableHead>Destinatario</TableHead>
              <TableHead>Intentos</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead>Enviado</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Aún no hay correos de vouchers en cola.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass[job.estado]}`}>
                      {job.estado}
                    </span>
                  </TableCell>
                  <TableCell>{job.empleadoNombre}</TableCell>
                  <TableCell>{job.destinatario}</TableCell>
                  <TableCell>{job.intentos}</TableCell>
                  <TableCell>{new Date(job.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{job.enviadoAt ? new Date(job.enviadoAt).toLocaleString() : "-"}</TableCell>
                  <TableCell className="max-w-sm whitespace-normal text-sm text-red-600">{job.errorMensaje ?? "-"}</TableCell>
                  <TableCell>
                    {job.estado === "ERROR" && (
                      <Button size="sm" variant="secondary" onClick={() => handleRetry(job.id)} disabled={isPending}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reenviar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
