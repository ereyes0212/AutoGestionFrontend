export interface Company {
    id: string
    nombre: string
  }
  
  export interface Employee {
    id: string
    nombre: string
    apellido: string
    correo: string
    edad: number
    genero: string
    activo: boolean
    usuario_id: string
    usuario: string
    puesto: string
    puesto_id: string
    jefe: string
    jefe_id: string | null
    empresas: Company[]
  }
  