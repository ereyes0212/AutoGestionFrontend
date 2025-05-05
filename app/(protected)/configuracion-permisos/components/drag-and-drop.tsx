"use client"

import type React from "react"

import { ArrowDown, ArrowUp, GripVertical, Plus, Save, Trash } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { Puesto } from "../../puestos/types"
import { postConfig } from "../actions"
import type { ConfigItem, OutputConfig } from "../type"

interface DragAndDropConfiguratorProps {
  initialItems: ConfigItem[]
  puestos: Puesto[]
}

export default function DragAndDropConfigurator({ initialItems, puestos }: DragAndDropConfiguratorProps) {
  // Estado para elementos del drag and drop
  const [items, setItems] = useState<ConfigItem[]>(initialItems)
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null)
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null)
  const { toast } = useToast()

  // Estado para el formulario del nuevo elemento
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [newTipo, setNewTipo] = useState<"Fijo" | "Dinamico">("Dinamico")
  const [newDescripcion, setNewDescripcion] = useState("")
  const [newPuestoSeleccionado, setNewPuestoSeleccionado] = useState<string>("")

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault()
    setDragOverItemIndex(index)

    if (draggedItemIndex === null || draggedItemIndex === index) return

    const newItems = Array.from(items)
    const [draggedItem] = newItems.splice(draggedItemIndex, 1)
    newItems.splice(index, 0, draggedItem)
    setItems(newItems)
    setDraggedItemIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedItemIndex(null)
    setDragOverItemIndex(null)
  }

  const handleDragLeave = () => {
    setDragOverItemIndex(null)
  }

  const moveItem = (fromIndex: number, direction: "up" | "down") => {
    if ((direction === "up" && fromIndex === 0) || (direction === "down" && fromIndex === items.length - 1)) {
      return
    }
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1
    const newItems = Array.from(items)
    const [movedItem] = newItems.splice(fromIndex, 1)
    newItems.splice(toIndex, 0, movedItem)
    setItems(newItems)
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...items]
    newItems.splice(index, 1)
    setItems(newItems)
  }

  const handleSave = async () => {
    const outputConfigs: OutputConfig[] = items.map((item, index) => {
      const config: OutputConfig = {
        nivel: index + 1,
        tipo: item.tipo,
        descripcion: item.descripcion,
        puesto_id: item.tipo === "Fijo" ? item.puesto_id : null,
      }

      return config
    })
    console.log("🚀 ~ constoutputConfigs:OutputConfig[]=items.map ~ outputConfigs:", outputConfigs)

    const success = await postConfig({ config: outputConfigs })

    if (success) {
      toast({
        title: "Configuración guardada",
        description: "La configuración ha sido guardada exitosamente.",
      })
    } else {
      toast({
        title: "Error al guardar",
        description: "Hubo un problema al guardar la configuración. Inténtalo nuevamente.",
        variant: "destructive",
      })
    }
  }

  const handleAddNewElement = () => {
    if (!newDescripcion.trim()) {
      toast({
        title: "Falta descripción",
        description: "Por favor ingresa una descripción.",
      })
      return
    }

    if (newTipo === "Fijo" && !newPuestoSeleccionado) {
      toast({
        title: "Falta puesto",
        description: "Selecciona un puesto para el tipo Fijo.",
      })
      return
    }

    const newElement: ConfigItem = {
      id: Date.now().toString(),
      descripcion: newDescripcion,
      tipo: newTipo,
      puesto_id: newPuestoSeleccionado,
      nivel: 0,
      activo: false,
    }

    setItems([...items, newElement])
    setNewDescripcion("")
    setNewTipo("Dinamico")
    setNewPuestoSeleccionado("")
    setIsFormOpen(false)
  }

  const resetForm = () => {
    setNewDescripcion("")
    setNewTipo("Dinamico")
    setNewPuestoSeleccionado("")
  }

  return (
    <div className="space-y-6 p-3 sm:p-4 border rounded-lg mx-auto max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Configuración de Niveles</h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Elemento
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] sm:h-auto sm:max-w-md sm:rounded-t-xl mx-auto">
              <SheetHeader className="mb-4">
                <SheetTitle>Agregar Nuevo Elemento</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-muted-foreground">Tipo</Label>
                  <Select value={newTipo} onValueChange={(value: "Fijo" | "Dinamico") => setNewTipo(value)}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dinamico">Dinámico</SelectItem>
                      <SelectItem value="Fijo">Fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-muted-foreground">Descripción</Label>
                  <Input
                    type="text"
                    value={newDescripcion}
                    onChange={(e) => setNewDescripcion(e.target.value)}
                    className="mt-1 block w-full"
                    placeholder="Ingrese una descripción"
                  />
                </div>
                {newTipo === "Fijo" && (
                  <div>
                    <Label className="block text-sm font-medium text-muted-foreground">Puesto</Label>
                    <Select value={newPuestoSeleccionado} onValueChange={(value) => setNewPuestoSeleccionado(value)}>
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Selecciona un puesto" />
                      </SelectTrigger>
                      <SelectContent>
                        {puestos.map((puesto) => (
                          <SelectItem key={puesto.id} value={puesto.id || ""}>
                            {puesto.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetForm()
                      setIsFormOpen(false)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAddNewElement}>Agregar</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Button size="sm" onClick={handleSave} className="flex-1 sm:flex-none">
            <Save className="h-4 w-4 mr-2 sm:mr-2" />
            <span>Guardar</span>
          </Button>
        </div>
      </div>

      <Separator />

      <p className="text-sm text-muted-foreground">
        Arrastra los elementos para reordenar los niveles de aprobación. El orden de arriba hacia abajo determina la
        secuencia.
      </p>

      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <Card
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onDragLeave={handleDragLeave}
            className={cn(
              "transition-all duration-200 border-2",
              draggedItemIndex === index ? "opacity-50 border-primary" : "",
              dragOverItemIndex === index ? "border-primary bg-primary/5" : "border-transparent",
              "hover:shadow-md",
            )}
          >
            <CardContent className="p-3 sm:p-4 flex items-start sm:items-center gap-2 sm:gap-4 border rounded-lg">
              <div className="flex flex-col items-center text-muted-foreground">
                <GripVertical className="h-5 w-5 sm:h-6 sm:w-6 cursor-move" />
                <span className="text-[10px] sm:text-xs font-medium mt-1">Nivel {index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm sm:text-lg truncate">{item.descripcion}</h3>
                <Badge variant={item.tipo.toLowerCase() === "fijo" ? "default" : "outline"} className="mt-1 text-xs">
                  {item.tipo}
                </Badge>
              </div>
              <div className="flex flex-row sm:flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveItem(index, "up")}
                  disabled={index === 0}
                  className="h-7 w-7 sm:h-8 sm:w-8"
                >
                  <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="sr-only">Mover arriba</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveItem(index, "down")}
                  disabled={index === items.length - 1}
                  className="h-7 w-7 sm:h-8 sm:w-8"
                >
                  <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="sr-only">Mover abajo</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive/90"
                >
                  <Trash className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 border border-dashed rounded-lg">
            <p className="text-muted-foreground">No hay elementos configurados.</p>
            <p className="text-sm text-muted-foreground mt-1">Agrega un nuevo elemento para comenzar.</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-4 right-4 flex justify-end mt-6">
        <Button onClick={handleSave} size="lg" className="shadow-lg">
          <Save className="h-4 w-4 mr-2" />
          Guardar Configuración
        </Button>
      </div>
    </div>
  )
}
