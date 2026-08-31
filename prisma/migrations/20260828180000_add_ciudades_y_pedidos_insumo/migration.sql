-- CreateTable
CREATE TABLE `Ciudad` (
    `id` VARCHAR(36) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updateAt` DATETIME(6) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Ciudades iniciales (los mismos ids que usa el seed)
INSERT INTO `Ciudad` (`id`, `nombre`, `activo`, `createAt`, `updateAt`) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Tegucigalpa', b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('22222222-2222-2222-2222-222222222222', 'San Pedro Sula', b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- CreateTable
CREATE TABLE `StockInsumo` (
    `id` VARCHAR(36) NOT NULL,
    `insumoId` VARCHAR(36) NOT NULL,
    `ciudadId` VARCHAR(36) NOT NULL,
    `stockActual` INTEGER NOT NULL DEFAULT 0,
    `stockMinimo` INTEGER NOT NULL DEFAULT 0,
    `createAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updateAt` DATETIME(6) NOT NULL,

    UNIQUE INDEX `StockInsumo_insumoId_ciudadId_key`(`insumoId`, `ciudadId`),
    INDEX `IX_StockInsumo_ciudadId`(`ciudadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- El stock que ya existía queda en San Pedro Sula; Tegucigalpa arranca en cero
INSERT INTO `StockInsumo` (`id`, `insumoId`, `ciudadId`, `stockActual`, `stockMinimo`, `createAt`, `updateAt`)
SELECT UUID(), `id`, '22222222-2222-2222-2222-222222222222', `stockActual`, `stockMinimo`, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM `Insumo`;

INSERT INTO `StockInsumo` (`id`, `insumoId`, `ciudadId`, `stockActual`, `stockMinimo`, `createAt`, `updateAt`)
SELECT UUID(), `id`, '11111111-1111-1111-1111-111111111111', 0, `stockMinimo`, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM `Insumo`;

-- CreateTable
CREATE TABLE `PedidoInsumo` (
    `id` VARCHAR(36) NOT NULL,
    `numero` INTEGER NOT NULL,
    `ciudadId` VARCHAR(36) NOT NULL,
    `estado` ENUM('PENDIENTE', 'RECIBIDO', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
    `solicitadoPorId` VARCHAR(36) NOT NULL,
    `fechaSolicitud` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `recibidoPorId` VARCHAR(36) NULL,
    `fechaRecepcion` DATETIME(6) NULL,
    `observaciones` TEXT NULL,
    `motivoCancelacion` TEXT NULL,
    `createAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updateAt` DATETIME(6) NOT NULL,

    UNIQUE INDEX `PedidoInsumo_numero_key`(`numero`),
    INDEX `IX_PedidoInsumo_ciudadId`(`ciudadId`),
    INDEX `IX_PedidoInsumo_estado`(`estado`),
    INDEX `IX_PedidoInsumo_solicitadoPorId`(`solicitadoPorId`),
    INDEX `IX_PedidoInsumo_recibidoPorId`(`recibidoPorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PedidoInsumoDetalle` (
    `id` VARCHAR(36) NOT NULL,
    `pedidoId` VARCHAR(36) NOT NULL,
    `insumoId` VARCHAR(36) NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `cantidadEmpaque` INTEGER NULL,
    `cantidadRecibida` INTEGER NULL,
    `observacion` TEXT NULL,
    `createAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updateAt` DATETIME(6) NOT NULL,

    INDEX `IX_PedidoInsumoDetalle_pedidoId`(`pedidoId`),
    INDEX `IX_PedidoInsumoDetalle_insumoId`(`insumoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: los movimientos existentes quedan en San Pedro Sula, que es
-- donde estaba el stock que generaron
ALTER TABLE `MovimientoInsumo` ADD COLUMN `ciudadId` VARCHAR(36) NULL,
    ADD COLUMN `pedidoId` VARCHAR(36) NULL;

UPDATE `MovimientoInsumo` SET `ciudadId` = '22222222-2222-2222-2222-222222222222' WHERE `ciudadId` IS NULL;

ALTER TABLE `MovimientoInsumo` MODIFY COLUMN `ciudadId` VARCHAR(36) NOT NULL;

-- CreateIndex
CREATE INDEX `IX_MovimientoInsumo_ciudadId` ON `MovimientoInsumo`(`ciudadId`);
CREATE INDEX `IX_MovimientoInsumo_pedidoId` ON `MovimientoInsumo`(`pedidoId`);

-- AlterTable: el stock ahora vive en StockInsumo
ALTER TABLE `Insumo` DROP COLUMN `stockActual`,
    DROP COLUMN `stockMinimo`;

-- AddForeignKey
ALTER TABLE `StockInsumo` ADD CONSTRAINT `StockInsumo_insumoId_fkey` FOREIGN KEY (`insumoId`) REFERENCES `Insumo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockInsumo` ADD CONSTRAINT `StockInsumo_ciudadId_fkey` FOREIGN KEY (`ciudadId`) REFERENCES `Ciudad`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoInsumo` ADD CONSTRAINT `MovimientoInsumo_ciudadId_fkey` FOREIGN KEY (`ciudadId`) REFERENCES `Ciudad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoInsumo` ADD CONSTRAINT `MovimientoInsumo_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `PedidoInsumo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PedidoInsumo` ADD CONSTRAINT `PedidoInsumo_ciudadId_fkey` FOREIGN KEY (`ciudadId`) REFERENCES `Ciudad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PedidoInsumo` ADD CONSTRAINT `PedidoInsumo_solicitadoPorId_fkey` FOREIGN KEY (`solicitadoPorId`) REFERENCES `Usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PedidoInsumo` ADD CONSTRAINT `PedidoInsumo_recibidoPorId_fkey` FOREIGN KEY (`recibidoPorId`) REFERENCES `Usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PedidoInsumoDetalle` ADD CONSTRAINT `PedidoInsumoDetalle_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `PedidoInsumo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PedidoInsumoDetalle` ADD CONSTRAINT `PedidoInsumoDetalle_insumoId_fkey` FOREIGN KEY (`insumoId`) REFERENCES `Insumo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
