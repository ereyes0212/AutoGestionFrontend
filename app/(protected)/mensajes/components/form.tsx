"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import type { z } from "zod"
import { Usuario } from "../../usuarios/type"
import { createGroupConversation } from "../actions"
import { ConversationSchema } from "../schema"

export function CrearGrupoForm({
    usuarios,
    creatorId,
}: {
    usuarios: Usuario[]
    creatorId: string
}) {
    const { toast } = useToast()
    const router = useRouter()

    const form = useForm<z.infer<typeof ConversationSchema>>({
        resolver: zodResolver(ConversationSchema),
        defaultValues: {
            nombre: "",
            userIds: [],
        },
    })

    const onSubmit = async (data: z.infer<typeof ConversationSchema>) => {
        try {
            await createGroupConversation(data.nombre, data.userIds, creatorId)

            toast({
                title: "Grupo Creado Exitosamente",
                description: `El grupo "${data.nombre}" ha sido creado con ${data.userIds.length} miembros.`,
            })

            form.reset()
            router.refresh()
        } catch (error) {
            console.error("Error al crear grupo:", error)
            toast({
                title: "Error",
                description: "Hubo un problema al crear el grupo. Inténtalo de nuevo.",
                variant: "destructive",
            })
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 border rounded-lg p-6 bg-card">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Crear Nuevo Grupo</h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Nombre del grupo */}
                    <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre del grupo</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej. Equipo de Ventas, Proyecto Alpha..." {...field} />
                                </FormControl>
                                <FormDescription>Elige un nombre descriptivo para tu grupo de conversación.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Lista de usuarios */}
                    <FormField
                        control={form.control}
                        name="userIds"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Seleccionar Miembros</FormLabel>
                                <FormDescription>Selecciona los usuarios que formarán parte del grupo.</FormDescription>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 max-h-60 overflow-y-auto border rounded-md p-4">
                                    {usuarios.map((usuario) => (
                                        <div
                                            key={usuario.id}
                                            className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                                        >
                                            <Checkbox
                                                id={usuario.id}
                                                checked={field.value.includes(usuario.id!)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        field.onChange([...field.value, usuario.id])
                                                    } else {
                                                        field.onChange(field.value.filter((id) => id !== usuario.id))
                                                    }
                                                }}
                                            />
                                            <label htmlFor={usuario.id} className="text-sm font-medium leading-none cursor-pointer flex-1">
                                                {usuario.usuario}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <FormMessage />
                                {field.value.length > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        {field.value.length} usuario{field.value.length !== 1 ? "s" : ""} seleccionado
                                        {field.value.length !== 1 ? "s" : ""}
                                    </p>
                                )}
                            </FormItem>
                        )}
                    />
                </div>

                {/* Botón de envío */}
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={form.formState.isSubmitting} className="min-w-[120px]">
                        {form.formState.isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creando...
                            </>
                        ) : (
                            "Crear Grupo"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
