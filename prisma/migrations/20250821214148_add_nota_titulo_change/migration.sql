/*
  Warnings:

  - Added the required column `titulo` to the `Nota` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Nota` ADD COLUMN `asignadoEmpleadoId` VARCHAR(36) NULL,
    ADD COLUMN `titulo` VARCHAR(250) NOT NULL;

-- CreateIndex
CREATE INDEX `Nota_asignadoEmpleadoId_idx` ON `Nota`(`asignadoEmpleadoId`);

-- CreateIndex
CREATE INDEX `Nota_estado_idx` ON `Nota`(`estado`);

-- AddForeignKey
ALTER TABLE `Nota` ADD CONSTRAINT `FK_Nota_Empleados_Asignado` FOREIGN KEY (`asignadoEmpleadoId`) REFERENCES `Empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
