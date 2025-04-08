"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { schemaSignIn, type TSchemaSignIn } from "../../../lib/shemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "../../../auth";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

function Login() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const formSignIn = useForm<TSchemaSignIn>({
        resolver: zodResolver(schemaSignIn),
        defaultValues: { usuario: "", contrasena: "" },
    });

    const onSubmit = async (data: TSchemaSignIn) => {
        try {
            startTransition(async () => {
                const response = await login(data);
                if (response.error) {
                    formSignIn.setError("contrasena", { message: response.error });
                    return;
                }
                router.push("/empleados");
            });
        } catch (error) {
            console.error("Error en el envío del formulario:", error);
        }
    };

    if (!mounted) return null; // Evita la hidratación en el servidor

    return (
        <Form {...formSignIn}>
            <form onSubmit={formSignIn.handleSubmit(onSubmit)} className="space-y-8 bg-gray-900 text-white p-6 rounded-lg">
                <FormField control={formSignIn.control} name="usuario" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Usuario</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="usuario" disabled={isPending} className="bg-gray-800 border-gray-700 text-white" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={formSignIn.control} name="contrasena" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input
                                    {...field}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="......."
                                    disabled={isPending}
                                    className="bg-gray-800 border-gray-700 text-white pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
            </form>
        </Form>
    );
}

export default Login;
