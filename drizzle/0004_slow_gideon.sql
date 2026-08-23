CREATE TABLE `content_activity_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentItemId` int NOT NULL,
	`deliverableId` int,
	`eventType` enum('generated','reviewed','downloaded','posted','feedback','archived') NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_activity_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `business_profiles` ADD `brandLogoKey` varchar(512);--> statement-breakpoint
ALTER TABLE `business_profiles` ADD `brandLogoUrl` text;--> statement-breakpoint
ALTER TABLE `business_profiles` ADD `brandPrimaryColor` varchar(20) DEFAULT '#263327' NOT NULL;--> statement-breakpoint
ALTER TABLE `business_profiles` ADD `brandAccentColor` varchar(20) DEFAULT '#EAF2CA' NOT NULL;--> statement-breakpoint
ALTER TABLE `business_profiles` ADD `defaultCta` varchar(120) DEFAULT 'Send us a message to order.' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `lifecycleStatus` enum('planned','generated','reviewed','downloaded','posted','archived') DEFAULT 'planned' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `generatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `content_items` ADD `reviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `content_items` ADD `downloadedAt` timestamp;--> statement-breakpoint
ALTER TABLE `content_items` ADD `postedAt` timestamp;--> statement-breakpoint
ALTER TABLE `content_items` ADD `feedbackOutcome` enum('not_set','conversations','orders','engagement','saved_for_later') DEFAULT 'not_set' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `feedbackNote` text;--> statement-breakpoint
ALTER TABLE `visual_slides` ADD `eyebrow` varchar(100);--> statement-breakpoint
ALTER TABLE `visual_slides` ADD `footer` varchar(180);--> statement-breakpoint
ALTER TABLE `visual_slides` ADD `cardType` enum('cover','guide','checklist','comparison','faq','product','closing') DEFAULT 'guide' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_activity_events` ADD CONSTRAINT `content_activity_events_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_activity_events` ADD CONSTRAINT `content_activity_events_contentItemId_content_items_id_fk` FOREIGN KEY (`contentItemId`) REFERENCES `content_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `content_activity_item_idx` ON `content_activity_events` (`contentItemId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `content_activity_user_idx` ON `content_activity_events` (`userId`,`createdAt`);