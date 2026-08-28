-- AlterTable
ALTER TABLE `Insumo` ADD COLUMN `unidadEmpaqueId` VARCHAR(36) NULL,
    ADD COLUMN `cantidadPorEmpaque` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `MovimientoInsumo` ADD COLUMN `cantidadEmpaque` INTEGER NULL;

-- CreateIndex
CREATE INDEX `IX_Insumo_unidadEmpaqueId` ON `Insumo`(`unidadEmpaqueId`);

-- AddForeignKey
ALTER TABLE `Insumo` ADD CONSTRAINT `Insumo_unidadEmpaqueId_fkey` FOREIGN KEY (`unidadEmpaqueId`) REFERENCES `UnidadInsumo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
