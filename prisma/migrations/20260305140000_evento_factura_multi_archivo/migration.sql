-- CreateTable
CREATE TABLE `EventoFacturaArchivo` (
  `id` VARCHAR(36) NOT NULL,
  `eventoFacturaId` VARCHAR(36) NOT NULL,
  `archivoUrl` VARCHAR(600) NOT NULL,
  `archivoKey` VARCHAR(400) NOT NULL,
  `archivoNombre` VARCHAR(250) NOT NULL,
  `archivoTipo` VARCHAR(120) NOT NULL,
  `createAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  INDEX `EventoFacturaArchivo_eventoFacturaId_idx`(`eventoFacturaId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Copy existing file data to child table
INSERT INTO `EventoFacturaArchivo` (
  `id`, `eventoFacturaId`, `archivoUrl`, `archivoKey`, `archivoNombre`, `archivoTipo`, `createAt`
)
SELECT
  UUID(), `id`, `archivoUrl`, `archivoKey`, `archivoNombre`, `archivoTipo`, `createAt`
FROM `EventoFactura`;

-- Drop old single-file columns from event table
ALTER TABLE `EventoFactura`
  DROP COLUMN `archivoUrl`,
  DROP COLUMN `archivoKey`,
  DROP COLUMN `archivoNombre`,
  DROP COLUMN `archivoTipo`;

-- AddForeignKey
ALTER TABLE `EventoFacturaArchivo`
  ADD CONSTRAINT `EventoFacturaArchivo_eventoFacturaId_fkey`
  FOREIGN KEY (`eventoFacturaId`) REFERENCES `EventoFactura`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
