-- CreateTable
CREATE TABLE `CategoriaActivo` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` TEXT NULL,
    `activo` BIT(1) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EstadoActivo` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Activo` (
    `id` VARCHAR(191) NOT NULL,
    `codigoBarra` VARCHAR(100) NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NULL,
    `categoriaId` VARCHAR(36) NOT NULL,
    `empleadoAsignadoId` VARCHAR(36) NULL,
    `fechaAsignacion` DATETIME(6) NULL,
    `fechaRegistro` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `estadoActualId` VARCHAR(36) NULL,
    `activo` BIT(1) NOT NULL,

    UNIQUE INDEX `Activo_codigoBarra_key`(`codigoBarra`),
    INDEX `IX_Activo_categoriaId`(`categoriaId`),
    INDEX `IX_Activo_empleadoAsignadoId`(`empleadoAsignadoId`),
    INDEX `IX_Activo_estadoActualId`(`estadoActualId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HistorialActivo` (
    `id` VARCHAR(191) NOT NULL,
    `activoId` VARCHAR(36) NOT NULL,
    `fechaRevision` DATETIME(6) NOT NULL,
    `estadoId` VARCHAR(36) NOT NULL,
    `observaciones` TEXT NULL,

    INDEX `IX_HistorialActivo_activoId`(`activoId`),
    INDEX `IX_HistorialActivo_estadoId`(`estadoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Activo` ADD CONSTRAINT `Activo_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `CategoriaActivo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Activo` ADD CONSTRAINT `Activo_empleadoAsignadoId_fkey` FOREIGN KEY (`empleadoAsignadoId`) REFERENCES `Empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Activo` ADD CONSTRAINT `Activo_estadoActualId_fkey` FOREIGN KEY (`estadoActualId`) REFERENCES `EstadoActivo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HistorialActivo` ADD CONSTRAINT `HistorialActivo_activoId_fkey` FOREIGN KEY (`activoId`) REFERENCES `Activo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HistorialActivo` ADD CONSTRAINT `HistorialActivo_estadoId_fkey` FOREIGN KEY (`estadoId`) REFERENCES `EstadoActivo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
