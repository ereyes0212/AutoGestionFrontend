-- CreateTable
CREATE TABLE `Conversacion` (
    `id` VARCHAR(36) NOT NULL,
    `nombre` VARCHAR(191) NULL,
    `tipo` ENUM('GROUP', 'PRIVATE') NOT NULL DEFAULT 'GROUP',
    `creadorId` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Conversacion_tipo_idx`(`tipo`),
    INDEX `Conversacion_creadorId_idx`(`creadorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Participante` (
    `id` VARCHAR(36) NOT NULL,
    `conversacionId` VARCHAR(36) NOT NULL,
    `usuarioId` VARCHAR(36) NOT NULL,
    `lastReadAt` DATETIME(3) NULL,
    `rol` VARCHAR(191) NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Participante_usuarioId_idx`(`usuarioId`),
    UNIQUE INDEX `Participante_conversacionId_usuarioId_key`(`conversacionId`, `usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Mensaje` (
    `id` VARCHAR(36) NOT NULL,
    `conversacionId` VARCHAR(36) NOT NULL,
    `autorId` VARCHAR(36) NOT NULL,
    `contenido` LONGTEXT NOT NULL,
    `editedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Mensaje_conversacionId_createdAt_idx`(`conversacionId`, `createdAt`),
    INDEX `Mensaje_autorId_idx`(`autorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MensajeEstado` (
    `id` VARCHAR(36) NOT NULL,
    `mensajeId` VARCHAR(36) NOT NULL,
    `usuarioId` VARCHAR(36) NOT NULL,
    `entregado` BOOLEAN NOT NULL DEFAULT false,
    `leido` BOOLEAN NOT NULL DEFAULT false,
    `entregadoAt` DATETIME(3) NULL,
    `leidoAt` DATETIME(3) NULL,

    INDEX `MensajeEstado_usuarioId_idx`(`usuarioId`),
    UNIQUE INDEX `MensajeEstado_mensajeId_usuarioId_key`(`mensajeId`, `usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attachment` (
    `id` VARCHAR(36) NOT NULL,
    `mensajeId` VARCHAR(36) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NULL,
    `nombre` VARCHAR(191) NULL,
    `tamaño` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Attachment_mensajeId_idx`(`mensajeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Participante` ADD CONSTRAINT `Participante_conversacionId_fkey` FOREIGN KEY (`conversacionId`) REFERENCES `Conversacion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Participante` ADD CONSTRAINT `Participante_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Mensaje` ADD CONSTRAINT `Mensaje_conversacionId_fkey` FOREIGN KEY (`conversacionId`) REFERENCES `Conversacion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Mensaje` ADD CONSTRAINT `Mensaje_autorId_fkey` FOREIGN KEY (`autorId`) REFERENCES `Usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MensajeEstado` ADD CONSTRAINT `MensajeEstado_mensajeId_fkey` FOREIGN KEY (`mensajeId`) REFERENCES `Mensaje`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attachment` ADD CONSTRAINT `Attachment_mensajeId_fkey` FOREIGN KEY (`mensajeId`) REFERENCES `Mensaje`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
