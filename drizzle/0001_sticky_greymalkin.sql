CREATE TABLE `business_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessName` varchar(160) NOT NULL,
	`businessType` varchar(160) NOT NULL,
	`targetAudience` text NOT NULL,
	`contentPillars` text NOT NULL,
	`postingGoal` text NOT NULL,
	`weeklyPostGoal` int NOT NULL DEFAULT 5,
	`brandVoice` varchar(160) NOT NULL DEFAULT 'Warm, clear, and credible',
	`isOnboarded` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_profile_user_idx` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `content_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int NOT NULL,
	`plannedFor` varchar(10) NOT NULL,
	`title` varchar(300) NOT NULL,
	`objective` varchar(120) NOT NULL,
	`format` enum('caption','carousel','tip','promo','story') NOT NULL,
	`brief` text NOT NULL,
	`caption` text,
	`hashtags` text,
	`carouselSlides` text,
	`status` enum('planned','completed') NOT NULL DEFAULT 'planned',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `business_profiles` ADD CONSTRAINT `business_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_items` ADD CONSTRAINT `content_items_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_items` ADD CONSTRAINT `content_items_profileId_business_profiles_id_fk` FOREIGN KEY (`profileId`) REFERENCES `business_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `content_item_user_date_idx` ON `content_items` (`userId`,`plannedFor`);--> statement-breakpoint
CREATE INDEX `content_item_profile_idx` ON `content_items` (`profileId`);