import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Empresa } from "@/lib/Types";

export const CheckboxEmpresas = ({
  clientes,
  selectedClientes,
  onChange,
}: {
  clientes: Empresa[];
  selectedClientes: string[];
  onChange: (selected: string[]) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleCheckboxChange = (id: string) => {
    const newSelected = selectedClientes.includes(id)
      ? selectedClientes.filter((cliente) => cliente !== id)
      : [...selectedClientes, id];

    onChange(newSelected);
  };

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Campo de búsqueda */}
      <Input
        type="text"
        placeholder="Buscar empresa..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2"
      />
      <ScrollArea className="h-auto max-h-96">
        {/* Lista de clientes con Checkbox */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredClientes.map((cliente) => (
            <Label
              key={cliente.id}
              htmlFor={cliente.id}
              className="flex items-center space-x-2 p-3 border border-muted-200 rounded-lg hover:bg-muted-100 transition duration-200 cursor-pointer"
            >
              <Checkbox
                id={cliente.id}
                checked={selectedClientes.includes(cliente.id || "")}
                onCheckedChange={() => handleCheckboxChange(cliente.id || "")}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-muted-800 font-medium">
                {cliente.nombre}
              </span>
            </Label>
          ))}
        </div>
      </ScrollArea>

      {filteredClientes.length === 0 && (
        <div className="text-muted-500">No se encontraron empresas.</div>
      )}
    </div>
  );
};
