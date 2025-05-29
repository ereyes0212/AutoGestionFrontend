-- CreateTable
CREATE TABLE `ConfiguracionAprobacion` (
    `Id` VARCHAR(36) NOT NULL,
    `puesto_id` VARCHAR(36) NULL,
    `Descripcion` VARCHAR(100) NOT NULL,
    `Tipo` VARCHAR(50) NOT NULL,
    `nivel` INTEGER NOT NULL,
    `Activo` BIT(1) NOT NULL,
    `Created_at` DATETIME(6) NULL,
    `Updated_at` DATETIME(6) NULL,
    `Adicionado_por` VARCHAR(100) NULL,
    `Modificado_por` VARCHAR(100) NULL,

    INDEX `IX_ConfiguracionAprobacion_puesto_id`(`puesto_id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DetalleVoucherPagos` (
    `Id` VARCHAR(36) NOT NULL,
    `VoucherPagoId` VARCHAR(36) NOT NULL,
    `TipoDeduccionId` VARCHAR(36) NOT NULL,
    `Monto` DECIMAL(65, 30) NOT NULL,
    `created_at` DATETIME(6) NULL,
    `updated_at` DATETIME(6) NULL,
    `adicionado_por` LONGTEXT NULL,
    `modificado_por` LONGTEXT NULL,

    INDEX `IX_DetalleVoucherPagos_TipoDeduccionId`(`TipoDeduccionId`),
    INDEX `IX_DetalleVoucherPagos_VoucherPagoId`(`VoucherPagoId`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Empleados` (
    `id` VARCHAR(36) NOT NULL,
    `puesto_id` VARCHAR(36) NOT NULL,
    `jefe_id` VARCHAR(36) NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `correo` LONGTEXT NOT NULL,
    `FechaNacimiento` DATETIME(6) NULL,
    `Vacaciones` INTEGER NOT NULL,
    `genero` LONGTEXT NOT NULL,
    `activo` BIT(1) NOT NULL,
    `created_at` DATETIME(6) NULL,
    `updated_at` DATETIME(6) NULL,
    `adicionado_por` LONGTEXT NULL,
    `modificado_por` LONGTEXT NULL,

    INDEX `IX_Empleados_jefe_id`(`jefe_id`),
    INDEX `IX_Empleados_puesto_id`(`puesto_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permiso` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,
    `activo` BOOLEAN NOT NULL,

    UNIQUE INDEX `Permiso_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Puesto` (
    `Id` VARCHAR(36) NOT NULL,
    `Nombre` VARCHAR(100) NOT NULL,
    `Descripcion` VARCHAR(100) NOT NULL,
    `Activo` BIT(1) NOT NULL,
    `Created_at` DATETIME(6) NULL,
    `Updated_at` DATETIME(6) NULL,
    `Adicionado_por` LONGTEXT NULL,
    `Modificado_por` LONGTEXT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReporteDiseño` (
    `Id` VARCHAR(36) NOT NULL,
    `EmpleadoId` VARCHAR(36) NOT NULL,
    `SeccionId` VARCHAR(36) NOT NULL,
    `FechaRegistro` DATETIME(6) NOT NULL,
    `PaginaInicio` INTEGER NOT NULL,
    `PaginaFin` INTEGER NOT NULL,
    `HoraInicio` TIME(6) NOT NULL,
    `HoraFin` TIME(6) NOT NULL,
    `Observacion` LONGTEXT NULL,
    `created_at` DATETIME(6) NULL,
    `updated_at` DATETIME(6) NULL,
    `adicionado_por` LONGTEXT NULL,
    `modificado_por` LONGTEXT NULL,

    INDEX `IX_ReporteDiseño_EmpleadoId`(`EmpleadoId`),
    INDEX `IX_ReporteDiseño_SeccionId`(`SeccionId`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolPermiso` (
    `id` VARCHAR(191) NOT NULL,
    `rolId` VARCHAR(191) NOT NULL,
    `permisoId` VARCHAR(191) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RolPermiso_permisoId_fkey`(`permisoId`),
    UNIQUE INDEX `RolPermiso_rolId_permisoId_key`(`rolId`, `permisoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rol` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,
    `activo` BOOLEAN NOT NULL,

    UNIQUE INDEX `Rol_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SolicitudVacacion` (
    `Id` VARCHAR(36) NOT NULL,
    `EmpleadoId` VARCHAR(36) NOT NULL,
    `PuestoId` VARCHAR(36) NOT NULL,
    `FechaSolicitud` DATETIME(6) NOT NULL,
    `FechaInicio` DATETIME(6) NOT NULL,
    `FechaFin` DATETIME(6) NOT NULL,
    `Aprobado` BOOLEAN NULL,
    `Descripcion` VARCHAR(250) NOT NULL,
    `CreatedAt` DATETIME(6) NOT NULL,
    `UpdatedAt` DATETIME(6) NULL,

    INDEX `IX_SolicitudVacacion_EmpleadoId`(`EmpleadoId`),
    INDEX `IX_SolicitudVacacion_PuestoId`(`PuestoId`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SolicitudVacacionAprobacion` (
    `Id` VARCHAR(36) NOT NULL,
    `SolicitudVacacionId` VARCHAR(36) NOT NULL,
    `ConfiguracionAprobacionId` VARCHAR(36) NOT NULL,
    `EmpleadoAprobadorId` VARCHAR(36) NULL,
    `Nivel` INTEGER NOT NULL,
    `Descripcion` LONGTEXT NOT NULL,
    `Estado` VARCHAR(50) NOT NULL,
    `CreatedAt` DATETIME(6) NOT NULL,
    `FechaDecision` DATETIME(6) NULL,
    `Comentarios` LONGTEXT NULL,
    `UpdatedAt` DATETIME(6) NULL,

    INDEX `IX_SolicitudVacacionAprobacion_ConfiguracionAprobacionId`(`ConfiguracionAprobacionId`),
    INDEX `IX_SolicitudVacacionAprobacion_EmpleadoAprobadorId`(`EmpleadoAprobadorId`),
    INDEX `IX_SolicitudVacacionAprobacion_SolicitudVacacionId`(`SolicitudVacacionId`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoDeducciones` (
    `Id` VARCHAR(36) NOT NULL,
    `Nombre` VARCHAR(100) NOT NULL,
    `Descripcion` VARCHAR(100) NOT NULL,
    `Activo` BIT(1) NOT NULL,
    `Created_at` DATETIME(6) NULL,
    `Updated_at` DATETIME(6) NULL,
    `Adicionado_por` LONGTEXT NULL,
    `Modificado_por` LONGTEXT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoSeccion` (
    `Id` VARCHAR(36) NOT NULL,
    `Nombre` VARCHAR(100) NOT NULL,
    `Descripcion` VARCHAR(100) NOT NULL,
    `Activo` BIT(1) NOT NULL,
    `Created_at` DATETIME(6) NULL,
    `Updated_at` DATETIME(6) NULL,
    `Adicionado_por` LONGTEXT NULL,
    `Modificado_por` LONGTEXT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoSolicitud` (
    `Id` VARCHAR(36) NOT NULL,
    `Nombre` VARCHAR(100) NOT NULL,
    `Descripcion` VARCHAR(100) NOT NULL,
    `activo` BIT(1) NOT NULL,
    `created_at` DATETIME(6) NULL,
    `updated_at` DATETIME(6) NULL,
    `adicionado_por` LONGTEXT NULL,
    `modificado_por` LONGTEXT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuarios` (
    `id` VARCHAR(36) NOT NULL,
    `empleado_id` VARCHAR(36) NOT NULL,
    `usuario` VARCHAR(50) NOT NULL,
    `contrasena` LONGTEXT NOT NULL,
    `DebeCambiarPassword` BOOLEAN NULL,
    `created_at` DATETIME(6) NULL,
    `updated_at` DATETIME(6) NULL,
    `rol_id` VARCHAR(36) NOT NULL,
    `activo` BIT(1) NOT NULL,
    `adicionado_por` LONGTEXT NULL,
    `modificado_por` LONGTEXT NULL,

    UNIQUE INDEX `IX_Usuarios_empleado_id`(`empleado_id`),
    INDEX `IX_Usuarios_rol_id`(`rol_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VoucherPagos` (
    `Id` VARCHAR(36) NOT NULL,
    `EmpleadoId` VARCHAR(36) NOT NULL,
    `FechaPago` DATETIME(6) NOT NULL,
    `DiasTrabajados` INTEGER NOT NULL,
    `SalarioDiario` DECIMAL(65, 30) NOT NULL,
    `SalarioMensual` DECIMAL(65, 30) NOT NULL,
    `NetoPagar` DECIMAL(65, 30) NOT NULL,
    `Observaciones` LONGTEXT NOT NULL,
    `created_at` DATETIME(6) NULL,
    `updated_at` DATETIME(6) NULL,
    `adicionado_por` LONGTEXT NULL,
    `modificado_por` LONGTEXT NULL,

    INDEX `IX_VoucherPagos_EmpleadoId`(`EmpleadoId`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ConfiguracionAprobacion` ADD CONSTRAINT `FK_ConfiguracionAprobacion_Puesto_puesto_id` FOREIGN KEY (`puesto_id`) REFERENCES `Puesto`(`Id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `DetalleVoucherPagos` ADD CONSTRAINT `FK_DetalleVoucherPagos_TipoDeducciones_TipoDeduccionId` FOREIGN KEY (`TipoDeduccionId`) REFERENCES `TipoDeducciones`(`Id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `DetalleVoucherPagos` ADD CONSTRAINT `FK_DetalleVoucherPagos_VoucherPagos_VoucherPagoId` FOREIGN KEY (`VoucherPagoId`) REFERENCES `VoucherPagos`(`Id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Empleados` ADD CONSTRAINT `FK_Empleados_Empleados_jefe_id` FOREIGN KEY (`jefe_id`) REFERENCES `Empleados`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Empleados` ADD CONSTRAINT `FK_Empleados_Puesto_puesto_id` FOREIGN KEY (`puesto_id`) REFERENCES `Puesto`(`Id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ReporteDiseño` ADD CONSTRAINT `FK_ReporteDiseño_Empleados_EmpleadoId` FOREIGN KEY (`EmpleadoId`) REFERENCES `Empleados`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ReporteDiseño` ADD CONSTRAINT `FK_ReporteDiseño_TipoSeccion_SeccionId` FOREIGN KEY (`SeccionId`) REFERENCES `TipoSeccion`(`Id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `RolPermiso` ADD CONSTRAINT `RolPermiso_permisoId_fkey` FOREIGN KEY (`permisoId`) REFERENCES `Permiso`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolPermiso` ADD CONSTRAINT `RolPermiso_rolId_fkey` FOREIGN KEY (`rolId`) REFERENCES `Rol`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SolicitudVacacion` ADD CONSTRAINT `FK_SolicitudVacacion_Empleados_EmpleadoId` FOREIGN KEY (`EmpleadoId`) REFERENCES `Empleados`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `SolicitudVacacion` ADD CONSTRAINT `FK_SolicitudVacacion_Puesto_PuestoId` FOREIGN KEY (`PuestoId`) REFERENCES `Puesto`(`Id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `SolicitudVacacionAprobacion` ADD CONSTRAINT `FK_SolicitudVacacionAprobacion_ConfiguracionAprobacion_Configur~` FOREIGN KEY (`ConfiguracionAprobacionId`) REFERENCES `ConfiguracionAprobacion`(`Id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `SolicitudVacacionAprobacion` ADD CONSTRAINT `FK_SolicitudVacacionAprobacion_Empleados_EmpleadoAprobadorId` FOREIGN KEY (`EmpleadoAprobadorId`) REFERENCES `Empleados`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `SolicitudVacacionAprobacion` ADD CONSTRAINT `FK_SolicitudVacacionAprobacion_SolicitudVacacion_SolicitudVacac~` FOREIGN KEY (`SolicitudVacacionId`) REFERENCES `SolicitudVacacion`(`Id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Usuarios` ADD CONSTRAINT `FK_Usuarios_Empleados_empleado_id` FOREIGN KEY (`empleado_id`) REFERENCES `Empleados`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Usuarios` ADD CONSTRAINT `Usuarios_rol_id_fkey` FOREIGN KEY (`rol_id`) REFERENCES `Rol`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VoucherPagos` ADD CONSTRAINT `FK_VoucherPagos_Empleados_EmpleadoId` FOREIGN KEY (`EmpleadoId`) REFERENCES `Empleados`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
