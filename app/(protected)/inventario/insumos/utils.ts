/**
 * Helpers de presentación de cantidades de insumos.
 *
 * El stock siempre se guarda en la unidad de consumo (unidad, rollo, bote).
 * El empaque (caja, fardo) es solo una forma de ingresar o sacar: al registrar
 * 2 cajas de 6 unidades se mueven 12 unidades.
 */

export function pluralizar(nombre: string, cantidad: number) {
  const limpio = nombre.trim();
  if (!limpio || cantidad === 1) return limpio;

  const ultima = limpio.slice(-1).toLowerCase();
  if ("aeiou".includes(ultima)) return `${limpio}s`;
  if (ultima === "z") return `${limpio.slice(0, -1)}ces`;
  if (ultima === "s") return limpio;
  if ("dlnr".includes(ultima)) return `${limpio}es`;
  return `${limpio}s`;
}

/** "12 unidades" */
export function formatCantidad(cantidad: number, unidadNombre: string) {
  return `${cantidad} ${pluralizar(unidadNombre, cantidad).toLowerCase()}`;
}

/** "1 caja = 6 unidades" — null si el insumo no maneja empaque */
export function contenidoEmpaqueLabel(
  cantidadPorEmpaque: number,
  unidadNombre: string,
  unidadEmpaqueNombre?: string | null
) {
  if (!unidadEmpaqueNombre || cantidadPorEmpaque <= 1) return null;
  return `1 ${unidadEmpaqueNombre.toLowerCase()} = ${formatCantidad(
    cantidadPorEmpaque,
    unidadNombre
  )}`;
}

/**
 * Equivalencia del stock en empaques: "2 cajas y 3 unidades".
 * Devuelve null cuando el insumo no maneja empaque.
 */
export function equivalenciaEmpaques(
  cantidad: number,
  cantidadPorEmpaque: number,
  unidadNombre: string,
  unidadEmpaqueNombre?: string | null
) {
  if (!unidadEmpaqueNombre || cantidadPorEmpaque <= 1) return null;

  const empaques = Math.floor(cantidad / cantidadPorEmpaque);
  const sueltas = cantidad % cantidadPorEmpaque;

  if (empaques === 0) return formatCantidad(sueltas, unidadNombre);

  const parteEmpaques = `${empaques} ${pluralizar(
    unidadEmpaqueNombre,
    empaques
  ).toLowerCase()}`;

  return sueltas === 0
    ? parteEmpaques
    : `${parteEmpaques} y ${formatCantidad(sueltas, unidadNombre)}`;
}

/**
 * Cómo se muestra la cantidad de un movimiento: si se registró por empaques
 * se antepone lo que tecleó el usuario. "2 cajas (12 unidades)"
 */
export function cantidadMovimientoLabel(
  cantidad: number,
  unidadNombre: string,
  cantidadEmpaque: number | null,
  unidadEmpaqueNombre?: string | null
) {
  const base = formatCantidad(cantidad, unidadNombre);

  if (!cantidadEmpaque || !unidadEmpaqueNombre) return base;

  return `${cantidadEmpaque} ${pluralizar(
    unidadEmpaqueNombre,
    cantidadEmpaque
  ).toLowerCase()} (${base})`;
}
