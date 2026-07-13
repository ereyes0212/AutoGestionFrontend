-- CreateTable
CREATE TABLE `VoucherEmailQueue` (
  `id` VARCHAR(36) NOT NULL,
  `voucherPagoId` VARCHAR(36) NOT NULL,
  `estado` ENUM('PENDIENTE', 'ENVIANDO', 'ENVIADO', 'ERROR') NOT NULL DEFAULT 'PENDIENTE',
  `destinatario` LONGTEXT NOT NULL,
  `empleadoNombre` VARCHAR(220) NOT NULL,
  `asunto` VARCHAR(180) NOT NULL,
  `errorMensaje` LONGTEXT NULL,
  `intentos` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updateAt` DATETIME(6) NOT NULL,
  `enviadoAt` DATETIME(6) NULL,

  INDEX `IX_VoucherEmailQueue_Estado`(`estado`),
  INDEX `IX_VoucherEmailQueue_VoucherPagoId`(`voucherPagoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VoucherEmailQueue` ADD CONSTRAINT `FK_VoucherEmailQueue_VoucherPagos` FOREIGN KEY (`voucherPagoId`) REFERENCES `VoucherPagos`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
