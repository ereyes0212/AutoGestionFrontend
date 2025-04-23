"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { GripVertical, Save, ArrowDown, ArrowUp, Trash } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ConfigItem, OutputConfig } from "../type"
import { useToast } from "@/hooks/use-toast"
import { Puesto } from "../../puestos/types"
import { postPuesto } from "../actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DragAndDropConfiguratorProps {
  initialItems: ConfigItem[]
  puestos: Puesto[]
}

export default function DragAndDropConfigurator({
  initialItems,
  puestos,
}: DragAndDropConfiguratorProps) {
  // Estado para elementos del drag and drop
  const [items, setItems] = useState<ConfigItem[]>(initialItems)
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null)
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null)
  const { toast } = useToast()

  // Estado para el formulario del nuevo elemento
  const [showNewElementForm, setShowNewElementForm] = useState(false)
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

  // Función para eliminar un elemento del arreglo
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
        puesto_id: item.tipo === "Fijo" ? item.puesto_id : null
      }

      return config
    })

    console.log("Configuración a guardar:", outputConfigs)
    const sendData = await postPuesto({ puesto: outputConfigs })
    toast({
      title: "Configuración guardada",
      description: "La configuración ha sido guardada exitosamente.",
    })
  }

  // Función para agregar el nuevo elemento al array de items
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
      activo: false
    }

    setItems([...items, newElement])
    setNewDescripcion("")
    setNewTipo("Dinamico")
    setNewPuestoSeleccionado("")
    setShowNewElementForm(false)
  }

  return (
    <div className="space-y-6 p-4 border m-4 rounded-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Configuración de Niveles</h2>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setShowNewElementForm((prev) => !prev)}>
            Nuevo Elemento
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Formulario para agregar nuevo elemento */}
      {showNewElementForm && (
        <Card className="p-4 border mb-4">
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium text-muted-foreground">
                  Tipo
                </Label>
                <div>
                  <Select
                    value={newTipo}
                    onValueChange={(value: "Fijo" | "Dinamico") => setNewTipo(value)}
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dinamico">Dinámico</SelectItem>
                      <SelectItem value="Fijo">Fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="block text-sm font-medium text-muted-foreground">
                  Descripción
                </Label>
                <Input
                  type="text"
                  value={newDescripcion}
                  onChange={(e) => setNewDescripcion(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  placeholder="Ingrese una descripción"
                />
              </div>
              {/* Si el tipo es Fijo se muestra el select de puestos */}
              {newTipo === "Fijo" && (
                <div>
                  <Label className="block text-sm font-medium text-muted-foreground">
                    Puesto
                  </Label>
                  <Select
                    value={newPuestoSeleccionado}
                    onValueChange={(value) => setNewPuestoSeleccionado(value)}
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Selecciona un puesto" />
                    </SelectTrigger>
                    <SelectContent>
                      {puestos.map((puesto) => (
                        <SelectItem key={puesto.id} value={puesto.id}>
                          {puesto.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleAddNewElement} className="mt-2" variant="secondary">
                Agregar al drag
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <p className="text-sm text-muted-foreground">
        Arrastra los elementos para reordenar los niveles de aprobación. El orden de arriba hacia abajo determina la secuencia.
      </p>
      <Separator />

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
              "hover:shadow-md"
            )}
          >
            <CardContent className="p-4 flex items-center gap-4 border rounded-lg">
              <div className="flex flex-col items-center text-muted-foreground">
                <GripVertical className="h-6 w-6 cursor-move" />
                <span className="text-xs font-medium mt-1">Nivel {index + 1}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-lg">{item.descripcion}</h3>
                <Badge variant={item.tipo.toLowerCase() === "fijo" ? "default" : "outline"} className="mt-1">
                  {item.tipo}
                </Badge>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveItem(index, "up")}
                  disabled={index === 0}
                  className="h-8 w-8"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveItem(index, "down")}
                  disabled={index === items.length - 1}
                  className="h-8 w-8"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  className="h-8 w-8"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} size="lg" className="gap-2">
          <Save className="h-4 w-4" />
          Guardar Configuración
        </Button>
      </div>
    </div>
  )
}
