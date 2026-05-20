CREATE DATABASE `soisluz`;
USE `soisluz`;

CREATE TABLE `usuario` (
     `id` int NOT NULL AUTO_INCREMENT,
    `nm_username` varchar(255) NOT NULL,
    `password` varchar(255) NOT NULL,
    `email` varchar(191) NOT NULL UNIQUE,
    `num_telefone` varchar(20) NOT NULL,
    `num_cpf` varchar(64)NOT NULL UNIQUE,
     role ENUM('user', 'admin') DEFAULT 'user',
    PRIMARY KEY (`id`)
);

CREATE TABLE `produto`(
    `id` INT NOT NULL AUTO_INCREMENT,
    `nm_produto` VARCHAR(255) NOT NULL,
    `vl_preco` DECIMAL(10,2) NOT NULL,
    `qt_estoque` INT NOT NULL DEFAULT 0 check (qt_estoque >= 0),
    `ds_produto` TEXT,
    PRIMARY KEY (`id`)
);

CREATE TABLE `cupom`(
    `id` INT NOT NULL AUTO_INCREMENT,
    `nm_cupom` VARCHAR(255) NOT NULL,
    `vl_desconto` DECIMAL(10,2) NOT NULL,
    `data_inicio` DATE,
    `data_fim` DATE,
    PRIMARY KEY (`id`)
);

CREATE TABLE `pedido` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `id_usuario` INT NOT NULL,
    `id_cupom` INT,
    `data_pedido` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('pendente','pago','enviado','cancelado') DEFAULT 'pendente',
    `valor_total` DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id`),
    FOREIGN KEY (`id_cupom`) REFERENCES `cupom`(`id`)
);

CREATE TABLE `pedido_item` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `id_pedido` INT NOT NULL,
    `id_produto` INT NOT NULL,
    `quantidade` INT NOT NULL,
    `preco_unitario` DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (`id_pedido`) REFERENCES `pedido`(`id`),
    FOREIGN KEY (`id_produto`) REFERENCES `produto`(`id`)
);

CREATE TABLE `endereco` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `id_usuario` INT NOT NULL,
    `rua` VARCHAR(255) NOT NULL,
    `numero` VARCHAR(20) NOT NULL,
    `bairro` VARCHAR(100) NOT NULL,
    `cidade` VARCHAR(100) NOT NULL,
    `estado` VARCHAR(50) NOT NULL,
    `cep` VARCHAR(20) NOT NULL,
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id`)
);

CREATE TABLE `imagens_produto` (
    `id_imagem` INT NOT NULL AUTO_INCREMENT,
    `id_produto` INT NOT NULL,
    `path_url` VARCHAR(255) NOT NULL,
    `ordem` INT DEFAULT 0,
    PRIMARY KEY (`id_imagem`),
    FOREIGN KEY (`id_produto`) REFERENCES `produto`(`id`) ON DELETE CASCADE
);

CREATE TABLE `favoritos` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `id_usuario` INT NOT NULL,
    `id_produto` INT NOT NULL,
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_produto`) REFERENCES `produto`(`id`) ON DELETE CASCADE
);

CREATE TABLE `carrinho` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `id_usuario` INT NOT NULL,
    `criado_em`DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id`) ON DELETE CASCADE
);

CREATE TABLE `carrinho_item` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `id_carrinho` INT NOT NULL,
    `id_produto` INT NOT NULL,
    `quantidade` INT NOT NULL,
    FOREIGN KEY (`id_carrinho`) REFERENCES `carrinho`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_produto`) REFERENCES `produto`(`id`) ON DELETE CASCADE
);