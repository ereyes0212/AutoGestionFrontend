'use client';

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { login, type LoginResult } from "../../../auth";
import { schemaSignIn, type TSchemaSignIn } from "../../../lib/shemas";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 1) Leemos de la URL: ?redirect=/ruta-que-queria-el-usuario
  const redirectTo = searchParams.get("redirect") ?? "/profile";

  useEffect(() => {
    setMounted(true);
  }, []);

  const formSignIn = useForm<TSchemaSignIn>({
    resolver: zodResolver(schemaSignIn),
    defaultValues: { usuario: "", contrasena: "" },
  });

  const onSubmit = (data: TSchemaSignIn) => {
    startTransition(async () => {
      const response: LoginResult = await login(data, redirectTo);

      if (response.error) {
        formSignIn.setError("contrasena", { message: response.error });
        return;
      }

      // 3) Reemplazamos la ruta actual por la de redirectTo
      router.replace(response.redirect!);
    });
  };

  if (!mounted) return null; // evitar hydration mismatch

  return (
    <Form {...formSignIn}>
      <form
        onSubmit={formSignIn.handleSubmit(onSubmit)}
        className="space-y-8 bg-gray-900 text-white p-6 rounded-lg"
      >
        <FormField
          control={formSignIn.control}
          name="usuario"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="usuario"
                  disabled={isPending}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={formSignIn.control}
          name="contrasena"
          render={({ field }) => (
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
          )}
        />

        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
        </Button>
      </form>
    </Form>
  );
}
