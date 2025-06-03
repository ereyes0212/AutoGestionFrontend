-- CreateTable
CREATE TABLE `ConfiguracionAprobacion` (
    `Id` VARCHAR(36) NOT NULL,
    `puesto_id` VARCHAR(36) NULL,
    `Descripcion` VARCHAR(100) NOT NULL,
    `Tipo` VARCHAR(50) NOT NULL,
    `nivel` INTEGER NOT NULL,
    `Activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `IX_ConfiguracionAprobacion_puesto_id`(`puesto_id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DetalleVoucherPagos` (
    `id` VARCHAR(36) NOT NULL,
    `voucherPagoId` VARCHAR(36) NOT NULL,
    `ajusteTipoId` VARCHAR(36) NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `IX_DetalleVoucher_AjusteTipoId`(`ajusteTipoId`),
    INDEX `IX_DetalleVoucher_VoucherPagoId`(`voucherPagoId`),
    PRIMARY KEY (`id`)
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
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

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
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

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
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

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
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

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
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,
    `FechaDecision` DATETIME(6) NULL,
    `Comentarios` LONGTEXT NULL,

    INDEX `IX_SolicitudVacacionAprobacion_ConfiguracionAprobacionId`(`ConfiguracionAprobacionId`),
    INDEX `IX_SolicitudVacacionAprobacion_EmpleadoAprobadorId`(`EmpleadoAprobadorId`),
    INDEX `IX_SolicitudVacacionAprobacion_SolicitudVacacionId`(`SolicitudVacacionId`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoDeducciones` (
    `id` VARCHAR(36) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(100) NULL,
    `categoria` ENUM('DEDUCCION', 'BONO') NOT NULL,
    `montoPorDefecto` DECIMAL(10, 2) NOT NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoSeccion` (
    `Id` VARCHAR(36) NOT NULL,
    `Nombre` VARCHAR(100) NOT NULL,
    `Descripcion` VARCHAR(100) NOT NULL,
    `Activo` BIT(1) NOT NULL,
    `CreateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdateAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoSolicitud` (
    `Id` VARCHAR(36) NOT NULL,
    `Nombre` VARCHAR(100) NOT NULL,
    `Descripcion` VARCHAR(100) NOT NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuarios` (
    `id` VARCHAR(36) NOT NULL,
    `empleado_id` VARCHAR(36) NOT NULL,
    `usuario` VARCHAR(50) NOT NULL,
    `contrasena` LONGTEXT NOT NULL,
    `DebeCambiarPassword` BOOLEAN NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,
    `rol_id` VARCHAR(36) NOT NULL,
    `activo` BIT(1) NOT NULL,

    UNIQUE INDEX `IX_Usuarios_empleado_id`(`empleado_id`),
    INDEX `IX_Usuarios_rol_id`(`rol_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VoucherPagos` (
    `id` VARCHAR(36) NOT NULL,
    `empleadoId` VARCHAR(36) NOT NULL,
    `fechaPago` DATETIME(6) NOT NULL,
    `diasTrabajados` INTEGER NOT NULL,
    `salarioDiario` DECIMAL(10, 2) NOT NULL,
    `salarioMensual` DECIMAL(10, 2) NOT NULL,
    `netoPagar` DECIMAL(10, 2) NOT NULL,
    `observaciones` LONGTEXT NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `IX_VoucherPagos_EmpleadoId`(`empleadoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ConfiguracionAprobacion` ADD CONSTRAINT `FK_ConfiguracionAprobacion_Puesto_puesto_id` FOREIGN KEY (`puesto_id`) REFERENCES `Puesto`(`Id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `DetalleVoucherPagos` ADD CONSTRAINT `FK_DetalleVoucher_AjusteTipo` FOREIGN KEY (`ajusteTipoId`) REFERENCES `TipoDeducciones`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `DetalleVoucherPagos` ADD CONSTRAINT `FK_DetalleVoucher_VoucherPagos` FOREIGN KEY (`voucherPagoId`) REFERENCES `VoucherPagos`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

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
ALTER TABLE `VoucherPagos` ADD CONSTRAINT `FK_VoucherPagos_Empleados` FOREIGN KEY (`empleadoId`) REFERENCES `Empleados`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
