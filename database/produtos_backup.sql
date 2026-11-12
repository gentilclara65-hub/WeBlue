/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.16-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: weblue
-- ------------------------------------------------------
-- Server version	10.11.16-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `produtos`
--

DROP TABLE IF EXISTS `produtos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `descricao` text NOT NULL,
  `preco` decimal(10,2) NOT NULL,
  `estoque` int(11) NOT NULL,
  `categoria` varchar(100) NOT NULL,
  `marca` varchar(100) NOT NULL,
  `imagem_url` varchar(500) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `data_criacao` datetime NOT NULL,
  `data_atualizacao` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produtos`
--

LOCK TABLES `produtos` WRITE;
/*!40000 ALTER TABLE `produtos` DISABLE KEYS */;
INSERT INTO `produtos` VALUES
(1,'Creme Pós-Barba Masculino','Creme pós-barba desenvolvido para hidratar, acalmar e refrescar a pele após o barbear. Ajuda a reduzir irritações, vermelhidão e ressecamento, deixando a pele macia, suave e com uma agradável sensação de frescor',59.90,100,'Cuidados Masculinos','WeBlue','https://i.postimg.cc/FRG3GMQt/Pote-Azul-Facetado-We-Blue-(2).png','ATIVO','2026-11-10 23:51:08','2026-11-10 23:51:08'),
(2,'Máquina de Barbear Elétrica Masculina','Máquina de barbear elétrica desenvolvida para proporcionar praticidade, conforto e precisão na hora de aparar os pelos. Possui design ergonômico, fácil manuseio e lâminas resistentes, ideal para manter a barba bem cuidada no dia a dia',89.90,50,'Barba e Barbear','WeBlue','https://i.postimg.cc/66mYXvDt/Whats-App-Image-2026-11-11-at-00-05-32.jpg','ATIVO','2026-11-11 00:07:31','2026-11-11 00:07:31'),
(3,'Espuma de Barbear Masculina','spuma de barbear desenvolvida para facilitar o deslizamento da lâmina, proporcionando um barbear mais suave e confortável. Ajuda a hidratar e proteger a pele, reduzindo o atrito e a irritação durante o barbear.',29.99,100,'Barba e Barbear','WeBlue',NULL,'INATIVO','2026-11-11 00:08:54','2026-11-11 00:09:50'),
(4,'Perfume Feminino','Perfume feminino com fragrância delicada e marcante, desenvolvido para proporcionar uma sensação agradável de frescor e elegância. Ideal para o dia a dia ou ocasiões especiais, deixando um aroma envolvente e duradouro na pele',299.90,170,'Perfumes','Weblue','https://i.postimg.cc/Y0MMynY1/Whats-App-Image-2026-11-11-at-00-11-23.jpg','ATIVO','2026-11-11 00:15:02','2026-11-11 00:15:02'),
(5,'Duo Blush e Iluminador','Produto 2 em 1 que combina blush e iluminador em uma única embalagem, proporcionando praticidade na maquiagem. O blush realça a cor das bochechas, enquanto o iluminador destaca os pontos do rosto, deixando a pele com um aspecto saudável, iluminado e radiante.',59.90,67,'Maquiagem','WeBlue','https://i.postimg.cc/q74wq2sX/Whats-App-Image-2026-11-11-at-00-11-28.jpg','ATIVO','2026-11-11 00:30:57','2026-11-11 00:30:57'),
(6,'Colônia Infantil','Colônia infantil com fragrância suave e delicada, desenvolvida para proporcionar uma agradável sensação de frescor e perfumação. Ideal para o dia a dia dos pequenos, deixando um cheirinho agradável e aconchegante.',69.90,45,'Colônias','Weblue','https://i.postimg.cc/W1wN0PZN/Whats-App-Image-2026-11-11-at-00-38-05.jpg','ATIVO','2026-11-11 00:39:57','2026-11-11 00:39:57'),
(7,'Kit Completo de Maquiagem','Kit de maquiagem completo, ideal para criar produções incríveis em qualquer ocasião. Pode incluir pincéis, base, pó compacto, primer, paleta de sombras e outros itens essenciais para preparar, uniformizar e realçar a beleza do rosto. Perfeito para quem ama maquiagem e busca praticidade em um só kit.',399.90,199,'Kits e Presentes','WeBlue','https://i.postimg.cc/LsspfgRy/Whats-App-Image-2026-11-11-at-00-11-22.jpg','ATIVO','2026-11-11 00:41:59','2026-11-11 00:41:59'),
(8,': Ventilador Elétrico Portátil','Ventilador elétrico desenvolvido para proporcionar praticidade e conforto nos dias quentes. Possui design moderno, fácil utilização e excelente opção para refrescar o ambiente, garantindo uma sensação agradável de ventilação no dia a dia',89.90,75,'Acessórios de Beleza','Weblue','https://i.postimg.cc/L53CNv3M/Whats-App-Image-2026-11-11-at-00-11-25.jpg','ATIVO','2026-11-11 00:44:30','2026-11-11 00:44:30');
/*!40000 ALTER TABLE `produtos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-11 16:22:59
