CREATE TABLE `product_archive_expiry_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobKey` varchar(64) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_archive_expiry_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_archive_expiry_jobs_jobKey_unique` UNIQUE(`jobKey`)
);
--> statement-breakpoint
CREATE INDEX `product_archive_expiry_task_idx` ON `product_archive_expiry_jobs` (`scheduleCronTaskUid`);