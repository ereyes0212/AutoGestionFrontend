/*
  Warnings:

  - Added the required column `numeroIdentificacion` to the `Empleados` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Empleados` ADD COLUMN `ciudadDomicilio` VARCHAR(100) NULL,
    ADD COLUMN `colonia` VARCHAR(100) NULL,
    ADD COLUMN `departamentoDomicilio` VARCHAR(100) NULL,
    ADD COLUMN `fechaIngreso` DATETIME(6) NULL,
    ADD COLUMN `numeroIdentificacion` VARCHAR(50) NOT NULL,
    ADD COLUMN `profesion` VARCHAR(100) NULL,
    ADD COLUMN `telefono` VARCHAR(20) NULL,
    MODIFY `genero` VARCHAR(20) NULL;
