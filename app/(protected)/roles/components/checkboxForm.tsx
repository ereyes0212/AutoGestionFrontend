import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input"; // Componente Input de ShadCN
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PermisosRol } from "@/lib/Types";
import { useState } from "react";

export const CheckboxPermisos = ({
  permisos,
  selectedPermisos,
  onChange,
}: {
  permisos: PermisosRol[]; // Array de permisos con id y nombre
  selectedPermisos: string[]; // Solo IDs
  onChange: (selected: string[]) => void; // Solo pasamos los IDs
}) => {
  const [searchTerm, setSearchTerm] = useState(""); // Estado para almacenar el término de búsqueda

  const handleCheckboxChange = (id: string) => {
    const newSelected = selectedPermisos.includes(id)
      ? selectedPermisos.filter((permiso) => permiso !== id)
      : [...selectedPermisos, id];
    onChange(newSelected); // Pasamos solo los IDs seleccionados
  };

  // Filtrar los permisos según el término de búsqueda
  const filteredPermisos = permisos.filter((permiso) =>
    permiso.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Buscar permisos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2"
        />
      </div>

      <ScrollArea className="h-[300px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredPermisos.map((permiso) => (
            <Label
              key={permiso.id}
              htmlFor={permiso.id} // Asociamos el div con el checkbox
              className="flex items-center space-x-2 p-3 border border-muted-200 rounded-lg hover:bg-muted-100 transition duration-200 cursor-pointer"
            >
              <Checkbox
                id={permiso.id} // Agregamos el id al checkbox
                checked={selectedPermisos.includes(permiso.id)} // Verificamos si el ID está seleccionado
                onCheckedChange={() => handleCheckboxChange(permiso.id)} // Solo pasamos el ID
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-muted-800 font-medium">{permiso.nombre}</span>
            </Label>
          ))}
        </div>
      </ScrollArea>

      {filteredPermisos.length === 0 && (
        <div className="text-muted-500">No se encontraron permisos.</div>
      )}
    </div>
  );
};
