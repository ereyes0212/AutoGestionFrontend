-- DropForeignKey
ALTER TABLE `Empleados` DROP FOREIGN KEY `FK_Empleados_Empleados_jefe_id`;

-- DropForeignKey
ALTER TABLE `Empleados` DROP FOREIGN KEY `FK_Empleados_Puesto_puesto_id`;

-- DropForeignKey
ALTER TABLE `Nota` DROP FOREIGN KEY `FK_Nota_Empleados_Aprobador`;

-- DropForeignKey
ALTER TABLE `Nota` DROP FOREIGN KEY `FK_Nota_Empleados_Asignado`;

-- DropForeignKey
ALTER TABLE `Nota` DROP FOREIGN KEY `FK_Nota_Empleados_Creador`;

-- AddForeignKey
ALTER TABLE `Empleados` ADD CONSTRAINT `Empleados_jefe_id_fkey` FOREIGN KEY (`jefe_id`) REFERENCES `Empleados`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Empleados` ADD CONSTRAINT `Empleados_puesto_id_fkey` FOREIGN KEY (`puesto_id`) REFERENCES `Puesto`(`Id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Nota` ADD CONSTRAINT `Nota_creadorEmpleadoId_fkey` FOREIGN KEY (`creadorEmpleadoId`) REFERENCES `Empleados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Nota` ADD CONSTRAINT `Nota_asignadoEmpleadoId_fkey` FOREIGN KEY (`asignadoEmpleadoId`) REFERENCES `Empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Nota` ADD CONSTRAINT `Nota_aprobadorEmpleadoId_fkey` FOREIGN KEY (`aprobadorEmpleadoId`) REFERENCES `Empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Empleados` RENAME INDEX `IX_Empleados_jefe_id` TO `Empleados_jefe_id_idx`;

-- RenameIndex
ALTER TABLE `Empleados` RENAME INDEX `IX_Empleados_puesto_id` TO `Empleados_puesto_id_idx`;
