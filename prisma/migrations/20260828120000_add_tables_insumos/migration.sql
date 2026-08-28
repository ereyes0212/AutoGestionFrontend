-- CreateTable
CREATE TABLE `UnidadInsumo` (
    `id` VARCHAR(36) NOT NULL,
    `nombre` VARCHAR(50) NOT NULL,
    `abreviatura` VARCHAR(20) NULL,
    `descripcion` TEXT NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updateAt` DATETIME(6) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Insumo` (
    `id` VARCHAR(36) NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NULL,
    `unidadId` VARCHAR(36) NOT NULL,
    `stockActual` INTEGER NOT NULL DEFAULT 0,
    `stockMinimo` INTEGER NOT NULL DEFAULT 0,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updateAt` DATETIME(6) NOT NULL,

    INDEX `IX_Insumo_unidadId`(`unidadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MovimientoInsumo` (
    `id` VARCHAR(36) NOT NULL,
    `insumoId` VARCHAR(36) NOT NULL,
    `tipo` ENUM('ENTRADA', 'SALIDA') NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `stockResultante` INTEGER NOT NULL,
    `fecha` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `observaciones` TEXT NULL,
    `usuarioId` VARCHAR(36) NOT NULL,
    `empleadoSolicitanteId` VARCHAR(36) NULL,
    `firmaToken` VARCHAR(64) NULL,
    `firmaTokenExpiraAt` DATETIME(6) NULL,
    `firmaKey` VARCHAR(400) NULL,
    `firmaFecha` DATETIME(6) NULL,
    `createAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updateAt` DATETIME(6) NOT NULL,

    UNIQUE INDEX `MovimientoInsumo_firmaToken_key`(`firmaToken`),
    INDEX `IX_MovimientoInsumo_insumoId`(`insumoId`),
    INDEX `IX_MovimientoInsumo_usuarioId`(`usuarioId`),
    INDEX `IX_MovimientoInsumo_empleadoSolicitanteId`(`empleadoSolicitanteId`),
    INDEX `IX_MovimientoInsumo_fecha`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Insumo` ADD CONSTRAINT `Insumo_unidadId_fkey` FOREIGN KEY (`unidadId`) REFERENCES `UnidadInsumo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoInsumo` ADD CONSTRAINT `MovimientoInsumo_insumoId_fkey` FOREIGN KEY (`insumoId`) REFERENCES `Insumo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoInsumo` ADD CONSTRAINT `MovimientoInsumo_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoInsumo` ADD CONSTRAINT `MovimientoInsumo_empleadoSolicitanteId_fkey` FOREIGN KEY (`empleadoSolicitanteId`) REFERENCES `Empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
