-- CreateTable
CREATE TABLE `EventoFactura` (
  `id` VARCHAR(36) NOT NULL,
  `empleadoId` VARCHAR(36) NOT NULL,
  `notaId` VARCHAR(36) NULL,
  `titulo` VARCHAR(200) NOT NULL,
  `descripcion` LONGTEXT NULL,
  `fechaEvento` DATETIME(6) NOT NULL,
  `archivoUrl` VARCHAR(600) NOT NULL,
  `archivoKey` VARCHAR(400) NOT NULL,
  `archivoNombre` VARCHAR(250) NOT NULL,
  `archivoTipo` VARCHAR(120) NOT NULL,
  `createAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updateAt` DATETIME(6) NOT NULL,

  INDEX `EventoFactura_empleadoId_idx`(`empleadoId`),
  INDEX `EventoFactura_notaId_idx`(`notaId`),
  INDEX `EventoFactura_fechaEvento_idx`(`fechaEvento`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EventoFactura`
  ADD CONSTRAINT `EventoFactura_empleadoId_fkey`
  FOREIGN KEY (`empleadoId`) REFERENCES `Empleados`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventoFactura`
  ADD CONSTRAINT `EventoFactura_notaId_fkey`
  FOREIGN KEY (`notaId`) REFERENCES `Nota`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
