CREATE TABLE `social_oauth_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('instagram','facebook') NOT NULL,
	`state` varchar(128) NOT NULL,
	`redirectUri` text NOT NULL,
	`requestedScopes` text NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_oauth_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `social_oauth_sessions_state_unique` UNIQUE(`state`)
);
--> statement-breakpoint
ALTER TABLE `social_oauth_sessions` ADD CONSTRAINT `social_oauth_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `social_oauth_state_expiry_idx` ON `social_oauth_sessions` (`state`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `social_oauth_user_idx` ON `social_oauth_sessions` (`userId`,`createdAt`);