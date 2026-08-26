ALTER TABLE `content_items` ADD `sourceContentItemId` int;--> statement-breakpoint
ALTER TABLE `content_items` ADD `entryType` enum('calendar','product_education') DEFAULT 'calendar' NOT NULL;--> statement-breakpoint
CREATE INDEX `content_item_entry_type_idx` ON `content_items` (`userId`,`entryType`);