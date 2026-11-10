-- CreateTable
CREATE TABLE `Video` (
    `id` VARCHAR(36) NOT NULL,
    `titulo` VARCHAR(200) NOT NULL,
    `estado` ENUM('SUBIENDO', 'EN_COLA', 'PROCESANDO', 'LISTO', 'ERROR') NOT NULL DEFAULT 'SUBIENDO',
    `nombreOriginal` VARCHAR(255) NOT NULL,
    `tamanoBytes` BIGINT NOT NULL,
    `claveOriginal` VARCHAR(512) NOT NULL,
    `duracionSeg` INTEGER NULL,
    `ancho` INTEGER NULL,
    `alto` INTEGER NULL,
    `intentos` INTEGER NOT NULL DEFAULT 0,
    `errorMensaje` TEXT NULL,
    `creadorEmpleadoId` VARCHAR(36) NOT NULL,
    `creadoAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `actualizadoAt` DATETIME(6) NOT NULL,

    INDEX `Video_estado_idx`(`estado`),
    INDEX `Video_creadoAt_idx`(`creadoAt`),
    INDEX `Video_creadorEmpleadoId_idx`(`creadorEmpleadoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Video` ADD CONSTRAINT `Video_creadorEmpleadoId_fkey` FOREIGN KEY (`creadorEmpleadoId`) REFERENCES `Empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Permisos del módulo (idempotente; luego se asignan a los roles desde "Configuración de permisos")
INSERT IGNORE INTO `Permiso` (`id`, `nombre`, `descripcion`, `createAt`, `updateAt`, `activo`) VALUES
    (UUID(), 'ver_videos', 'Permiso para ver el modulo de videos y copiar el codigo para insertar', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3), 1),
    (UUID(), 'subir_videos', 'Permiso para subir videos y reintentar los que fallaron', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3), 1),
    (UUID(), 'eliminar_videos', 'Permiso para eliminar videos', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3), 1);
