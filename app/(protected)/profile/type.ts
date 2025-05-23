export interface Company {
    id: string
    nombre: string
  }
  
  export interface Employee {
    id: string
    nombre: string
    apellido: string
    correo: string
    fechaNacimiento: Date
    genero: string
    activo: boolean
    usuario_id: string
    usuario: string
    vacaciones: number
    puesto: string
    puesto_id: string
    jefe: string
    jefe_id: string | null
  }
  