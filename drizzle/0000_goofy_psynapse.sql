-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `accounts` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`provider_account_id` varchar(255) NOT NULL,
	`refresh_token` text DEFAULT 'NULL',
	`access_token` text DEFAULT 'NULL',
	`expires_at` int(11) DEFAULT 'NULL',
	`token_type` varchar(255) DEFAULT 'NULL',
	`scope` varchar(255) DEFAULT 'NULL',
	`id_token` text DEFAULT 'NULL',
	`session_state` varchar(255) DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `chapters` (
	`id` varchar(255) NOT NULL,
	`order` int(11) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`video_url` varchar(255) DEFAULT 'NULL',
	`duration` int(11) DEFAULT 'NULL',
	`is_published` tinyint(1) DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
	`updated_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
	CONSTRAINT `chapters_order_unique` UNIQUE(`order`),
	CONSTRAINT `chapters_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sections` (
	`id` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`order` int(11) NOT NULL,
	`chapter_id` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
	`updated_at` timestamp NOT NULL DEFAULT 'current_timestamp()'
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(255) NOT NULL,
	`session_token` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL DEFAULT 'current_timestamp()',
	CONSTRAINT `sessions_session_token_unique` UNIQUE(`session_token`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) DEFAULT 'NULL',
	`email` varchar(255) NOT NULL,
	`email_verified` tinyint(1) DEFAULT 0,
	`image` varchar(255) DEFAULT 'NULL',
	`password` varchar(255) DEFAULT 'NULL',
	`role` varchar(50) DEFAULT '''USER''',
	`created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
	`updated_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `user_chapter_progress` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`chapter_id` varchar(255) NOT NULL,
	`is_completed` tinyint(1) DEFAULT 0,
	`completed_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
	`last_played_at` timestamp NOT NULL DEFAULT '''0000-00-00 00:00:00''',
	`progress` float DEFAULT 'NULL',
	`video_progress` int(11) DEFAULT 'NULL',
	`created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
	`updated_at` timestamp NOT NULL DEFAULT 'current_timestamp()'
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL DEFAULT 'current_timestamp()'
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
*/