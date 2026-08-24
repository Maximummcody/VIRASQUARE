ALTER TABLE `business_profiles` ADD `instagramHandle` varchar(80);--> statement-breakpoint
ALTER TABLE `business_profiles` ADD `closingSignature` varchar(140);--> statement-breakpoint
ALTER TABLE `business_profiles` ADD `businessContext` text;--> statement-breakpoint
ALTER TABLE `business_profiles` ADD `businessContextStatus` enum('not_started','dismissed','completed') DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE `business_profiles` ADD `productInviteStatus` enum('not_started','dismissed','completed') DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `productId` int;--> statement-breakpoint
ALTER TABLE `products` ADD `productCategory` varchar(100);--> statement-breakpoint
ALTER TABLE `products` ADD `bestFor` varchar(320);--> statement-breakpoint
ALTER TABLE `products` ADD `choiceReasons` text;--> statement-breakpoint
ALTER TABLE `products` ADD `buyerNote` varchar(500);--> statement-breakpoint
ALTER TABLE `products` ADD `categoryDetails` text;--> statement-breakpoint
ALTER TABLE `content_items` ADD CONSTRAINT `content_items_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE set null ON UPDATE no action;