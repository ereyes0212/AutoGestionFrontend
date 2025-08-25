/*
  Warnings:

  - The values [REVISION] on the enum `Nota_estado` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Nota` MODIFY `estado` ENUM('PENDIENTE', 'APROBADA', 'FINALIZADA', 'RECHAZADA') NOT NULL;
