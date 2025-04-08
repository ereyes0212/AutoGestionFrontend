"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Login from "./components/formLogin";

export default function LoginPage() {
  return (
      <Card className="w-full max-w-md mx-auto bg-gray-800 text-white border-gray-700 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Bienvenido</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Ingrese sus credenciales para iniciar sesión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Login />
        </CardContent>
      </Card>
  );
}
