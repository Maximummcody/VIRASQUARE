CREATE TABLE `product_selling_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deliverableId` int NOT NULL,
	`productId` int,
	`caption` text NOT NULL,
	`buyerReply` text NOT NULL,
	`nextAngleTitle` varchar(240) NOT NULL,
	`nextAngleDescription` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_selling_packages_id` PRIMARY KEY(`id`),
	CONSTRAINT `selling_package_deliverable_idx` UNIQUE(`deliverableId`)
);
--> statement-breakpoint
ALTER TABLE `product_selling_packages` ADD CONSTRAINT `product_selling_packages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_selling_packages` ADD CONSTRAINT `product_selling_packages_deliverableId_visual_deliverables_id_fk` FOREIGN KEY (`deliverableId`) REFERENCES `visual_deliverables`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_selling_packages` ADD CONSTRAINT `product_selling_packages_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `selling_package_user_idx` ON `product_selling_packages` (`userId`);