CREATE TABLE `social_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('instagram','facebook') NOT NULL,
	`externalAccountId` varchar(160) NOT NULL,
	`accountName` varchar(200) NOT NULL,
	`username` varchar(160),
	`linkedPageId` varchar(160),
	`encryptedAccessToken` text,
	`tokenExpiresAt` timestamp,
	`grantedScopes` text,
	`connectionStatus` enum('pending','connected','needs_reconnect','disconnected') NOT NULL DEFAULT 'pending',
	`lastErrorCode` varchar(120),
	`lastErrorMessage` varchar(500),
	`connectedAt` timestamp,
	`disconnectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `social_account_external_idx` UNIQUE(`platform`,`externalAccountId`)
);
--> statement-breakpoint
CREATE TABLE `social_publish_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`socialAccountId` int,
	`contentItemId` int,
	`deliverableId` int,
	`visualSlideId` int,
	`platform` enum('instagram','facebook') NOT NULL,
	`status` enum('awaiting_confirmation','scheduled','publishing','published','failed','cancelled') NOT NULL DEFAULT 'awaiting_confirmation',
	`captionSnapshot` text NOT NULL,
	`assetKey` varchar(512) NOT NULL,
	`assetUrl` text NOT NULL,
	`isAiGenerated` boolean NOT NULL DEFAULT false,
	`scheduledFor` timestamp,
	`scheduledTimeZone` varchar(100),
	`scheduleCronTaskUid` varchar(65),
	`idempotencyKey` varchar(96) NOT NULL,
	`providerContainerId` varchar(180),
	`providerPostId` varchar(180),
	`providerPermalink` text,
	`failureCode` varchar(120),
	`failureMessage` varchar(700),
	`requestedAt` timestamp,
	`publishedAt` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_publish_attempts_id` PRIMARY KEY(`id`),
	CONSTRAINT `social_publish_idempotency_idx` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
ALTER TABLE `social_accounts` ADD CONSTRAINT `social_accounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_publish_attempts` ADD CONSTRAINT `social_publish_attempts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_publish_attempts` ADD CONSTRAINT `social_publish_attempts_socialAccountId_social_accounts_id_fk` FOREIGN KEY (`socialAccountId`) REFERENCES `social_accounts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_publish_attempts` ADD CONSTRAINT `social_publish_attempts_contentItemId_content_items_id_fk` FOREIGN KEY (`contentItemId`) REFERENCES `content_items`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_publish_attempts` ADD CONSTRAINT `social_publish_attempts_deliverableId_visual_deliverables_id_fk` FOREIGN KEY (`deliverableId`) REFERENCES `visual_deliverables`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_publish_attempts` ADD CONSTRAINT `social_publish_attempts_visualSlideId_visual_slides_id_fk` FOREIGN KEY (`visualSlideId`) REFERENCES `visual_slides`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `social_account_user_status_idx` ON `social_accounts` (`userId`,`connectionStatus`);--> statement-breakpoint
CREATE INDEX `social_publish_user_status_idx` ON `social_publish_attempts` (`userId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `social_publish_schedule_task_idx` ON `social_publish_attempts` (`scheduleCronTaskUid`);--> statement-breakpoint
CREATE INDEX `social_publish_content_idx` ON `social_publish_attempts` (`contentItemId`,`deliverableId`);