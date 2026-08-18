CREATE TABLE `publicProjects` (
	`id` varchar(128) NOT NULL,
	`ownerId` int NOT NULL,
	`url` varchar(2048) NOT NULL,
	`title` varchar(80) NOT NULL,
	`category` enum('Game','Tool','App','Portfolio','Other') NOT NULL,
	`note` varchar(160) NOT NULL DEFAULT '',
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publicProjects_id` PRIMARY KEY(`id`)
);
