"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { registrarCheckActivo } from "../../../actions";
import { Activo, EstadoActivo } from "../../../types";

const formSchema = z.object({
    estadoId: z.string().min(1, "El estado es requerido"),
    observaciones: z.string().min(1, "La observación es requerida"),
});

interface ActivoCheckFormProps {
    activo: Activo;
    estados: EstadoActivo[];
}

export default function ActivoCheckForm({ activo, estados }: ActivoCheckFormProps) {
    const router = useRouter();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            estadoId: "",
            observaciones: "",
        },
    });


    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (!activo.id) {
                throw new Error("ID del activo no encontrado");
            }
            await registrarCheckActivo({
                activoId: activo.id,
                ...values,
            });
            toast.success("Check registrado exitosamente");
            router.push("/inventario/activo");
        } catch (error) {
            toast.error("Error al registrar el check");
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Check de Activo</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium">{activo.nombre}</h3>
                    <p className="text-sm text-gray-500">Código: {activo.codigoBarra}</p>
                    <p className="text-sm text-gray-500">Categoría: {activo.categoria!.nombre}</p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="estadoId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione el estado" />
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

                    <FormField
                        control={form.control}
                        name="observaciones"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Observaciones</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Ingrese las observaciones..."
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/inventario/activo")}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit">Guardar</Button>
                    </div>
                </form>
            </Form>
        </div>
    );
} 