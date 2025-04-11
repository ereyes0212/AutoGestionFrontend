export type ConfigItem = {
    id: string;
    // Estos datos se muestran en la UI pero no se usan directamente para el API
    empresa: string;
    puesto: string;
    descripcion: string;
    tipo: "Fijo" | "Dinamico";
    nivel: number;
    activo: boolean;
  };
  export type OutputConfig = {
    Empresa_id: string;
    puesto_id?: string; // se incluye si "tipo" es "Fijo"
    nivel: number;
    tipo: "Fijo" | "Dinamico";
    descripcion: string;
  };
  