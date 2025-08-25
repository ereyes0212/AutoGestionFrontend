-- DropForeignKey
ALTER TABLE `Empleados` DROP FOREIGN KEY `FK_Empleados_Empleados_jefe_id`;

-- DropForeignKey
ALTER TABLE `Empleados` DROP FOREIGN KEY `FK_Empleados_Puesto_puesto_id`;

-- CreateTable
CREATE TABLE `Nota` (
    `id` VARCHAR(36) NOT NULL,
    `creadorEmpleadoId` VARCHAR(36) NOT NULL,
    `asignadoEmpleadoId` VARCHAR(36) NULL,
    `aprobadorEmpleadoId` VARCHAR(36) NULL,
    `estado` ENUM('PENDIENTE', 'APROBADA', 'FINALIZADA', 'RECHAZADA') NOT NULL,
    `titulo` VARCHAR(250) NOT NULL,
    `descripcion` LONGTEXT NOT NULL,
    `fellback` LONGTEXT NULL,
    `createAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updateAt` DATETIME(6) NOT NULL,

    INDEX `Nota_creadorEmpleadoId_idx`(`creadorEmpleadoId`),
    INDEX `Nota_asignadoEmpleadoId_idx`(`asignadoEmpleadoId`),
    INDEX `Nota_aprobadorEmpleadoId_idx`(`aprobadorEmpleadoId`),
    INDEX `Nota_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Empleados` ADD CONSTRAINT `Empleados_jefe_id_fkey` FOREIGN KEY (`jefe_id`) REFERENCES `Empleados`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Empleados` ADD CONSTRAINT `Empleados_puesto_id_fkey` FOREIGN KEY (`puesto_id`) REFERENCES `Puesto`(`Id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Nota` ADD CONSTRAINT `Nota_creadorEmpleadoId_fkey` FOREIGN KEY (`creadorEmpleadoId`) REFERENCES `Empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Nota` ADD CONSTRAINT `Nota_asignadoEmpleadoId_fkey` FOREIGN KEY (`asignadoEmpleadoId`) REFERENCES `Empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Nota` ADD CONSTRAINT `Nota_aprobadorEmpleadoId_fkey` FOREIGN KEY (`aprobadorEmpleadoId`) REFERENCES `Empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Empleados` RENAME INDEX `IX_Empleados_jefe_id` TO `Empleados_jefe_id_idx`;

-- RenameIndex
ALTER TABLE `Empleados` RENAME INDEX `IX_Empleados_puesto_id` TO `Empleados_puesto_id_idx`;
