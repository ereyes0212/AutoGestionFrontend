"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { FacturaArchivo } from "../types";

export default function ArchivosPreviewGrid({ archivos }: { archivos: FacturaArchivo[] }) {
  const [activeImage, setActiveImage] = useState<{ src: string; nombre: string } | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {archivos.map((archivo) => {
          const isImage = archivo.archivoTipo.startsWith("image/");
          const previewUrl = `/api/facturas/archivo/${archivo.id}`;

          return (
            <Card key={archivo.id}>
              <CardHeader>
                <CardTitle className="text-base break-all">{archivo.archivoNombre}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <button
                    type="button"
                    onClick={() => setActiveImage({ src: previewUrl, nombre: archivo.archivoNombre })}
                    className="w-full"
                  >
                    <img
                      src={previewUrl}
                      alt={archivo.archivoNombre}
                      className="w-full max-h-80 object-contain rounded border"
                    />
                  </button>
                ) : (
                  <iframe
                    src={previewUrl}
                    title={archivo.archivoNombre}
                    className="w-full h-[28rem] rounded border"
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {activeImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative bg-background rounded-md max-w-6xl w-full p-3">
            <Button
              variant="outline"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setActiveImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage.src}
              alt={activeImage.nombre}
              className="w-full max-h-[85vh] object-contain rounded"
            />
          </div>
        </div>
      )}
    </>
  );
}
