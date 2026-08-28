-- AlterTable
ALTER TABLE `MovimientoInsumo` ADD COLUMN `cancelado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canceladoAt` DATETIME(6) NULL,
    ADD COLUMN `canceladoPorId` VARCHAR(36) NULL,
    ADD COLUMN `motivoCancelacion` TEXT NULL;

-- CreateIndex
CREATE INDEX `IX_MovimientoInsumo_canceladoPorId` ON `MovimientoInsumo`(`canceladoPorId`);

-- AddForeignKey
ALTER TABLE `MovimientoInsumo` ADD CONSTRAINT `MovimientoInsumo_canceladoPorId_fkey` FOREIGN KEY (`canceladoPorId`) REFERENCES `Usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
