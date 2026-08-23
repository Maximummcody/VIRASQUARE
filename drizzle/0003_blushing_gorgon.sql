CREATE TABLE `product_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`role` enum('primary','gallery') NOT NULL DEFAULT 'gallery',
	`sortOrder` int NOT NULL DEFAULT 0,
	`storageKey` varchar(512) NOT NULL,
	`url` text NOT NULL,
	`mimeType` varchar(100) NOT NULL DEFAULT 'image/jpeg',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `product_media` ADD CONSTRAINT `product_media_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `product_media_product_idx` ON `product_media` (`productId`,`sortOrder`);