"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { getSession, login } from "../../../auth";
import { schemaSignIn, type TSchemaSignIn } from "../../../lib/shemas";
import ForgotPasswordForm from "./forworgot";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false); // controla el estado del Dialog

  const { toast } = useToast();
  const redirectTo = searchParams.get("redirect") ?? "/profile";

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<TSchemaSignIn>({
    resolver: zodResolver(schemaSignIn),
    defaultValues: { usuario: "", contrasena: "" },
  });

  const onSubmit = (values: TSchemaSignIn) => {
    startTransition(async () => {
      const response = await login(values, redirectTo);
      if (response.error) {
        form.setError("contrasena", { message: response.error });
        return;
      }
      const session = await getSession();
      if (session?.DebeCambiar) {
        router.replace("/reset-password");
      } else {
        router.replace(response.redirect!);
      }
    });
  };

  if (!mounted) return null;

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 bg-gray-900 text-white p-6 rounded-lg"
        >
          <FormField
            control={form.control}
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
            control={form.control}
            name="contrasena"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="*******"
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

          <div className="flex justify-between items-center">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isPending}
            >
              {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>

            <Button
              variant="link"
              className="text-sm text-gray-400 hover:text-white"
              type="button"
              onClick={() => setOpen(true)}
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </div>
        </form>
      </Form>

      {/* Dialog fuera del form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Recuperar contraseña</DialogTitle>
            <DialogDescription>
              Ingresa tu usuario para recibir un correo con el enlace de restablecimiento.
            </DialogDescription>
          </DialogHeader>
          <ForgotPasswordForm
            onCancel={() => setOpen(false)}
            onSuccess={() => {
              setOpen(false);
              router.push("/"); // O la ruta que prefieras al enviar
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
