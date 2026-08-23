CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`price` varchar(80),
	`currency` varchar(12) NOT NULL DEFAULT 'NGN',
	`details` text,
	`imageKey` varchar(512) NOT NULL,
	`imageUrl` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visual_deliverables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentItemId` int,
	`productId` int,
	`type` enum('single_post','carousel','story') NOT NULL,
	`title` varchar(300) NOT NULL,
	`aspectRatio` varchar(20) NOT NULL DEFAULT '1:1',
	`status` enum('draft','generating','ready','failed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visual_deliverables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visual_slides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliverableId` int NOT NULL,
	`slideNumber` int NOT NULL,
	`heading` varchar(240) NOT NULL,
	`body` text,
	`sourceMode` enum('product','generated','template') NOT NULL DEFAULT 'template',
	`assetKey` varchar(512),
	`assetUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visual_slides_id` PRIMARY KEY(`id`),
	CONSTRAINT `visual_slide_order_idx` UNIQUE(`deliverableId`,`slideNumber`)
);
--> statement-breakpoint
ALTER TABLE `business_profiles` ADD `businessCategory` enum('fashion','accessories','beauty','personal_care','other') DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `visual_deliverables` ADD CONSTRAINT `visual_deliverables_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `visual_deliverables` ADD CONSTRAINT `visual_deliverables_contentItemId_content_items_id_fk` FOREIGN KEY (`contentItemId`) REFERENCES `content_items`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `visual_deliverables` ADD CONSTRAINT `visual_deliverables_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `visual_slides` ADD CONSTRAINT `visual_slides_deliverableId_visual_deliverables_id_fk` FOREIGN KEY (`deliverableId`) REFERENCES `visual_deliverables`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `product_user_idx` ON `products` (`userId`);--> statement-breakpoint
CREATE INDEX `visual_user_idx` ON `visual_deliverables` (`userId`);--> statement-breakpoint
CREATE INDEX `visual_content_idx` ON `visual_deliverables` (`contentItemId`);