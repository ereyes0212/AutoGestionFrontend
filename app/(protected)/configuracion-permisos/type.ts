export type ConfigItem = {
    id: string;

    puesto_id: string;
    descripcion: string;
    tipo: "Fijo" | "Dinamico";
    nivel: number;
    activo: boolean;
  };
  export type OutputConfig = {
    puesto_id?: string | null; // se incluye si "tipo" es "Fijo"
    nivel: number;
    tipo: "Fijo" | "Dinamico";
    descripcion: string;
  };
  