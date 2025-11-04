-- CreateTable
CREATE TABLE `Evento` (
    `id` VARCHAR(36) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `ubicacion` VARCHAR(250) NOT NULL,
    `empleadoId` VARCHAR(36) NOT NULL,
    `facturaAdjunta` VARCHAR(500) NOT NULL,
    `notaEnlace` VARCHAR(500) NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `creadoAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Evento` ADD CONSTRAINT `Evento_empleadoId_fkey` FOREIGN KEY (`empleadoId`) REFERENCES `Empleados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
