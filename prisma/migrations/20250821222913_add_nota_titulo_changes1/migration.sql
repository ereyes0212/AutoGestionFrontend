-- DropForeignKey
ALTER TABLE `Nota` DROP FOREIGN KEY `Nota_creadorEmpleadoId_fkey`;

-- AddForeignKey
ALTER TABLE `Nota` ADD CONSTRAINT `Nota_creadorEmpleadoId_fkey` FOREIGN KEY (`creadorEmpleadoId`) REFERENCES `Empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
