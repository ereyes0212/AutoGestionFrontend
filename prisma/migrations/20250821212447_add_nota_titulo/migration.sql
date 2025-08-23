-- CreateTable
CREATE TABLE `Nota` (
    `id` VARCHAR(36) NOT NULL,
    `creadorEmpleadoId` VARCHAR(36) NOT NULL,
    `aprobadorEmpleadoId` VARCHAR(36) NULL,
    `estado` ENUM('PENDIENTE', 'APROBADA', 'FINALIZADA', 'RECHAZADA', 'REVISION') NOT NULL,
    `fellback` LONGTEXT NULL,
    `createAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updateAt` DATETIME(6) NOT NULL,

    INDEX `Nota_creadorEmpleadoId_idx`(`creadorEmpleadoId`),
    INDEX `Nota_aprobadorEmpleadoId_idx`(`aprobadorEmpleadoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Nota` ADD CONSTRAINT `FK_Nota_Empleados_Creador` FOREIGN KEY (`creadorEmpleadoId`) REFERENCES `Empleados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Nota` ADD CONSTRAINT `FK_Nota_Empleados_Aprobador` FOREIGN KEY (`aprobadorEmpleadoId`) REFERENCES `Empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
