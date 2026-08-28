"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { saveAs } from "file-saver";
import { FileDown, FileSpreadsheet, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { Insumo } from "../../types";
import { generarReporteInsumos } from "../actions";
import {
  ContenidoReporte,
  ReporteInsumos,
  ReporteMovimiento,
  TipoReporteInsumo,
} from "../types";
import RangoFechas from "./rango-fechas";

interface ReporteInsumosProps {
  insumos: Insumo[];
}

/**
 * Descarga las firmas guardadas en S3 y las convierte a data URL para poder
 * incrustarlas en el PDF. Si alguna falla, esa fila cae al texto de respaldo.
 */
async function cargarFirmas(movimientos: ReporteMovimiento[]) {
  const firmas = new Map<string, string>();

  await Promise.all(
    movimientos
      .filter((movimiento) => movimiento.firmado)
      .map(async (movimiento) => {
        try {
          const respuesta = await fetch(`/api/insumos/firma/${movimiento.id}`);
          if (!respuesta.ok) return;

          const blob = await respuesta.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const lector = new FileReader();
            lector.onloadend = () => resolve(String(lector.result));
            lector.onerror = () => reject(lector.error);
            lector.readAsDataURL(blob);
          });

          firmas.set(movimiento.id, dataUrl);
        } catch {
          // Sin firma incrustada: la celda queda con el texto "Firmado"
        }
      })
  );

  return firmas;
}

export default function ReporteInsumosComponent({ insumos }: ReporteInsumosProps) {
  const { toast } = useToast();
  const [tipo, setTipo] = useState<TipoReporteInsumo>("GENERAL");
  const [contenido, setContenido] = useState<ContenidoReporte>("TODOS");
  const [insumoId, setInsumoId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [cargando, setCargando] = useState(false);
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [reporte, setReporte] = useState<ReporteInsumos | null>(null);

  const generar = async () => {
    setCargando(true);
    const resultado = await generarReporteInsumos({
      tipo,
      contenido,
      insumoId: tipo === "PRODUCTO" ? insumoId : undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
    });
    setCargando(false);

    if (!resultado.success) {
      setReporte(null);
      toast({
        title: "Error",
        description: resultado.error,
        variant: "destructive",
      });
      return;
    }

    setReporte(resultado.data);
  };

  const nombreArchivo = (extension: string) =>
    `reporte-insumos-${tipo.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.${extension}`;

  const descargarPDF = async () => {
    if (!reporte || descargandoPdf) return;

    setDescargandoPdf(true);
    try {
      await generarPDF(reporte);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF.",
        variant: "destructive",
      });
    } finally {
      setDescargandoPdf(false);
    }
  };

  const generarPDF = async (reporte: ReporteInsumos) => {
    const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new JsPDF({
      orientation: reporte.movimientos.length > 0 ? "landscape" : "portrait",
    });

    doc.setFontSize(16);
    doc.text(reporte.titulo, 14, 15);

    doc.setFontSize(10);
    doc.text(`Período: ${reporte.periodoLabel}`, 14, 22);
    doc.text(`Generado el ${reporte.generadoEl} por ${reporte.generadoPor}`, 14, 27);
    doc.text(
      `Insumos: ${reporte.resumen.totalInsumos}  |  Bajo stock: ${reporte.resumen.insumosBajoStock}  |  ` +
        `Movimientos: ${reporte.resumen.totalMovimientos}  |  Entradas: ${reporte.resumen.totalEntradas}  |  ` +
        `Salidas: ${reporte.resumen.totalSalidas}  |  Salidas sin firma: ${reporte.resumen.salidasSinFirma}`,
      14,
      32
    );

    autoTable(doc, {
      startY: 38,
      head: [
        ["Insumo", "Unidad", "Empaque", "Stock actual", "Entradas", "Salidas", "Estado"],
      ],
      body: reporte.detalle.map((fila) => [
        fila.nombre,
        fila.unidadNombre,
        fila.contenidoLabel ?? "-",
        String(fila.stockActual),
        String(fila.entradas),
        String(fila.salidas),
        fila.bajoStock ? "Bajo stock" : "Normal",
      ]),
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    if (reporte.movimientos.length > 0) {
      const firmas = await cargarFirmas(reporte.movimientos);
      const finalY = (doc as any).lastAutoTable?.finalY ?? 38;
      const columnaFirma = 7;

      const truncado = reporte.movimientos.length < reporte.resumen.totalMovimientos;

      doc.setFontSize(12);
      doc.text("Detalle de movimientos", 14, finalY + 10);

      if (truncado) {
        doc.setFontSize(8);
        doc.text(
          `Mostrando ${reporte.movimientos.length} de ${reporte.resumen.totalMovimientos} movimientos. Acote el rango de fechas para verlos todos.`,
          14,
          finalY + 15
        );
      }

      autoTable(doc, {
        startY: finalY + (truncado ? 19 : 14),
        head: [
          [
            "Fecha",
            "Insumo",
            "Tipo",
            "Cantidad",
            "Stock",
            "Solicitó",
            "Registró",
            "Firma",
            "Observaciones",
          ],
        ],
        body: reporte.movimientos.map((movimiento) => [
          movimiento.fechaLabel,
          movimiento.insumoNombre,
          movimiento.tipo === "ENTRADA" ? "Entrada" : "Salida",
          `${movimiento.tipo === "ENTRADA" ? "+" : "-"}${movimiento.cantidadLabel}`,
          String(movimiento.stockResultante),
          movimiento.solicitadoPor,
          movimiento.registradoPor,
          // La firma se dibuja como imagen en didDrawCell; el texto es el respaldo
          movimiento.tipo === "ENTRADA"
            ? "-"
            : firmas.has(movimiento.id)
              ? ""
              : movimiento.firmado
                ? `Firmado ${movimiento.firmaFechaLabel ?? ""}`.trim()
                : "(sin firma)",
          movimiento.observaciones,
        ]),
        theme: "grid",
        styles: { fontSize: 7 },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          0: { cellWidth: 24 },
          2: { cellWidth: 16 },
          4: { cellWidth: 14 },
          5: { cellWidth: 34 },
          6: { cellWidth: 34 },
          [columnaFirma]: { cellWidth: 34, minCellHeight: 16 },
          8: { cellWidth: 30 },
        },
        didDrawCell: (data) => {
          if (data.section !== "body" || data.column.index !== columnaFirma) return;

          const movimiento = reporte.movimientos[data.row.index];
          const firma = movimiento ? firmas.get(movimiento.id) : undefined;
          if (!firma) return;

          doc.addImage(firma, "PNG", data.cell.x + 2, data.cell.y + 2, 30, 12);
        },
      });
    }

    doc.save(nombreArchivo("pdf"));
  };

  const descargarExcel = async () => {
    if (!reporte) return;

    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    const hojaResumen = XLSX.utils.json_to_sheet(
      reporte.detalle.map((fila) => ({
        Insumo: fila.nombre,
        Unidad: fila.unidadNombre,
        Empaque: fila.contenidoLabel ?? "",
        "Stock actual": fila.stockActual,
        Entradas: fila.entradas,
        Salidas: fila.salidas,
        Estado: fila.bajoStock ? "Bajo stock" : "Normal",
        Activo: fila.activo ? "Sí" : "No",
      }))
    );
    XLSX.utils.book_append_sheet(wb, hojaResumen, "Existencias");

    if (reporte.movimientos.length > 0) {
      const hojaMovimientos = XLSX.utils.json_to_sheet(
        reporte.movimientos.map((movimiento) => ({
          Fecha: movimiento.fechaLabel,
          Insumo: movimiento.insumoNombre,
          Unidad: movimiento.unidadNombre,
          Tipo: movimiento.tipo === "ENTRADA" ? "Entrada" : "Salida",
          Cantidad: movimiento.cantidad,
          Empaques: movimiento.cantidadEmpaque ?? "",
          Detalle: movimiento.cantidadLabel,
          "Stock resultante": movimiento.stockResultante,
          Solicitó: movimiento.solicitadoPor,
          Registró: movimiento.registradoPor,
          Firma:
            movimiento.tipo === "ENTRADA"
              ? ""
              : movimiento.firmado
                ? "Firmado"
                : "(sin firma)",
          "Fecha firma": movimiento.firmaFechaLabel ?? "",
          Observaciones: movimiento.observaciones,
        }))
      );
      XLSX.utils.book_append_sheet(wb, hojaMovimientos, "Movimientos");
    }

    const contenido = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([contenido]), nombreArchivo("xlsx"));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros del reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label>Tipo de reporte</Label>
              <Select
                value={tipo}
                onValueChange={(valor) => {
                  setTipo(valor as TipoReporteInsumo);
                  setReporte(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General (existencias)</SelectItem>
                  <SelectItem value="FECHA">Por fecha</SelectItem>
                  <SelectItem value="PRODUCTO">Por producto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Registros</Label>
              <Select
                value={contenido}
                onValueChange={(valor) => {
                  setContenido(valor as ContenidoReporte);
                  setReporte(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Entradas y salidas</SelectItem>
                  <SelectItem value="ENTRADAS">Solo entradas</SelectItem>
                  <SelectItem value="SALIDAS">Solo salidas</SelectItem>
                  <SelectItem value="STOCK">Solo stock actual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipo === "PRODUCTO" && (
              <div className="space-y-1">
                <Label>Producto</Label>
                <Select value={insumoId} onValueChange={setInsumoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un insumo" />
                  </SelectTrigger>
                  <SelectContent>
                    {insumos.map((insumo) => (
                      <SelectItem key={insumo.id} value={insumo.id!}>
                        {insumo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label>Período</Label>
              <RangoFechas
                desde={desde}
                hasta={hasta}
                onChange={(nuevoDesde, nuevoHasta) => {
                  setDesde(nuevoDesde);
                  setHasta(nuevoHasta);
                }}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={generar} disabled={cargando} className="w-full">
                {cargando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Generar reporte
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {tipo === "GENERAL"
              ? "Muestra las existencias de todos los insumos. Las fechas son opcionales y acotan los totales de entradas y salidas."
              : tipo === "FECHA"
                ? "Muestra los movimientos registrados en el rango de fechas indicado."
                : "Muestra el historial completo de un insumo. Las fechas son opcionales."}
          </p>
        </CardContent>
      </Card>

      {reporte && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{reporte.titulo}</h2>
              <p className="text-sm text-muted-foreground">
                {reporte.periodoLabel} · Generado el {reporte.generadoEl} por{" "}
                {reporte.generadoPor}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={descargarPDF}
                disabled={descargandoPdf}
                className="flex items-center gap-2"
              >
                {descargandoPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                PDF
              </Button>
              <Button variant="secondary" onClick={descargarExcel} className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            {[
              { titulo: "Insumos", valor: reporte.resumen.totalInsumos },
              { titulo: "Bajo stock", valor: reporte.resumen.insumosBajoStock },
              { titulo: "Movimientos", valor: reporte.resumen.totalMovimientos },
              { titulo: "Entradas", valor: reporte.resumen.totalEntradas },
              { titulo: "Salidas", valor: reporte.resumen.totalSalidas },
              { titulo: "Salidas sin firma", valor: reporte.resumen.salidasSinFirma },
            ].map((kpi) => (
              <Card key={kpi.titulo}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{kpi.titulo}</p>
                  <p className="text-2xl font-bold">{kpi.valor}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="rounded-md border">
            <div className="border-b p-3 text-sm font-medium">Existencias</div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insumo</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Empaque</TableHead>
                    <TableHead>Stock actual</TableHead>
                    <TableHead>Entradas</TableHead>
                    <TableHead>Salidas</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reporte.detalle.length ? (
                    reporte.detalle.map((fila) => (
                      <TableRow key={fila.insumoId}>
                        <TableCell className="font-medium">{fila.nombre}</TableCell>
                        <TableCell>{fila.unidadNombre}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fila.contenidoLabel ?? "-"}
                        </TableCell>
                        <TableCell>{fila.stockActual}</TableCell>
                        <TableCell>{fila.entradas}</TableCell>
                        <TableCell>{fila.salidas}</TableCell>
                        <TableCell>
                          <Badge variant={fila.bajoStock ? "destructive" : "default"}>
                            {fila.bajoStock ? "Bajo stock" : "Normal"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Sin información para los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {reporte.movimientos.length > 0 && (
            <div className="rounded-md border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
                <span className="text-sm font-medium">Detalle de movimientos</span>
                {reporte.movimientos.length < reporte.resumen.totalMovimientos && (
                  <span className="text-xs text-muted-foreground">
                    Mostrando {reporte.movimientos.length} de{" "}
                    {reporte.resumen.totalMovimientos} movimientos
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Insumo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Solicitó</TableHead>
                      <TableHead>Registró</TableHead>
                      <TableHead>Firma</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reporte.movimientos.map((movimiento) => (
                      <TableRow key={movimiento.id}>
                        <TableCell className="whitespace-nowrap">
                          {movimiento.fechaLabel}
                        </TableCell>
                        <TableCell>{movimiento.insumoNombre}</TableCell>
                        <TableCell>
                          <Badge
                            variant={movimiento.tipo === "ENTRADA" ? "default" : "secondary"}
                          >
                            {movimiento.tipo === "ENTRADA" ? "Entrada" : "Salida"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {movimiento.tipo === "ENTRADA" ? "+" : "-"}
                          {movimiento.cantidadLabel}
                        </TableCell>
                        <TableCell>{movimiento.stockResultante}</TableCell>
                        <TableCell>{movimiento.solicitadoPor}</TableCell>
                        <TableCell>{movimiento.registradoPor}</TableCell>
                        <TableCell>
                          {movimiento.tipo === "ENTRADA" ? (
                            <span className="text-muted-foreground">-</span>
                          ) : movimiento.firmado ? (
                            <a
                              href={`/api/insumos/firma/${movimiento.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Firmado ${movimiento.firmaFechaLabel ?? ""}`.trim()}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`/api/insumos/firma/${movimiento.id}`}
                                alt={`Firma de ${movimiento.solicitadoPor}`}
                                className="h-10 w-auto rounded border bg-white"
                              />
                            </a>
                          ) : (
                            <Badge variant="destructive">Sin firma</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
