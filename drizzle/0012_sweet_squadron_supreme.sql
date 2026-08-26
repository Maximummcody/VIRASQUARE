ALTER TABLE `products` ADD `archiveStatus` enum('active','archived') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `products` ADD `archiveExpiresAt` timestamp;--> statement-breakpoint
CREATE INDEX `product_archive_expiry_idx` ON `products` (`archiveStatus`,`archiveExpiresAt`);