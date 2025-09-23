-- CreateTable
CREATE TABLE `tareas` (
    `id` VARCHAR(36) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `fechaInicio` DATETIME(3) NOT NULL,
    `fechaFin` DATETIME(3) NULL,
    `todoDia` BOOLEAN NOT NULL DEFAULT false,
    `estado` ENUM('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
    `prioridad` ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE') NOT NULL DEFAULT 'MEDIA',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tareas_fechaInicio_idx`(`fechaInicio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tareas_empleados` (
    `tareaId` VARCHAR(36) NOT NULL,
    `empleadoId` VARCHAR(36) NOT NULL,
    `asignadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `rol` VARCHAR(191) NULL,

    INDEX `tareas_empleados_empleadoId_idx`(`empleadoId`),
    PRIMARY KEY (`tareaId`, `empleadoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tareas_empleados` ADD CONSTRAINT `tareas_empleados_tareaId_fkey` FOREIGN KEY (`tareaId`) REFERENCES `tareas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tareas_empleados` ADD CONSTRAINT `tareas_empleados_empleadoId_fkey` FOREIGN KEY (`empleadoId`) REFERENCES `Empleados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
