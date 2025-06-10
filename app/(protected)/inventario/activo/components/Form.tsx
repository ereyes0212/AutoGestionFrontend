"use client";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { postActivo, putActivo } from "../actions";
import { activoSchema } from "../schema";

export function ActivoFormulario({
    isUpdate,
    initialData,
    categorias,
    estados,
    empleados,
}: {
    isUpdate: boolean;
    initialData: z.infer<typeof activoSchema>;
    categorias: any[]; // Ajusta el tipo según tu modelo de datos
    estados: any[]; // Ajusta el tipo según tu modelo de datos
    empleados: any[]; // Ajusta el tipo según tu modelo de datos
}) {
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<z.infer<typeof activoSchema>>({
        resolver: zodResolver(activoSchema),
        defaultValues: initialData,
    });

    const { formState } = form;

    //forma de saber si un form esta valido o no
    const isValid = formState.errors;
    console.log("isValid");
    console.log(isValid);

    async function onSubmit(data: z.infer<typeof activoSchema>) {
        try {
            if (isUpdate) {
                await putActivo(data);
            } else {
                await postActivo(data);
            }

            toast({
                title: isUpdate ? "Actualización Exitosa" : "Creación Exitosa",
                description: isUpdate
                    ? "El activo ha sido actualizado."
                    : "El activo ha sido creado.",
            });

            router.push("/inventario/activo");
            router.refresh();
        } catch (error) {
            console.error("Error en la operación:", error);
            toast({
                title: "Error",
                description: `Hubo un problema: ${error}`,
            });
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 border rounded-md p-4"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nombre del activo" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="descripcion"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descripción</FormLabel>
                                <FormControl>
                                    <Input placeholder="Descripción del activo" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="categoriaId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoría</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona una categoría" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {categorias.map((categoria) => (
                                            <SelectItem key={categoria.id} value={categoria.id}>
                                                {categoria.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="empleadoAsignadoId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Empleado Asignado</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un empleado" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {empleados.map((empleado) => (
                                            <SelectItem key={empleado.id} value={empleado.id}>
                                                {`${empleado.nombre} ${empleado.apellido}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="estadoActualId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un estado" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {estados.map((estado) => (
                                            <SelectItem key={estado.id} value={estado.id}>
                                                {estado.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {isUpdate && (
                    <FormField
                        control={form.control}
                        name="activo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select
                                    onValueChange={(value) => field.onChange(value === "true")}
                                    defaultValue={field.value ? "true" : "false"}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona el estado" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="true">Activo</SelectItem>
                                        <SelectItem value="false">Inactivo</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <div className="flex justify-end">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cargando...
                            </>
                        ) : isUpdate ? (
                            "Actualizar"
                        ) : (
                            "Crear"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
} 