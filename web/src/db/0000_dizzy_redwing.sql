CREATE TABLE IF NOT EXISTS `adminuser` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`passwordHash` text NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `AdminUser_email_key` ON `adminuser` (`email`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `emailcode` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`expiresAt` text NOT NULL,
	`used` integer DEFAULT false NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `EmailCode_email_code_idx` ON `emailcode` (`email`,`code`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `license` (
	`id` text PRIMARY KEY NOT NULL,
	`keyId` text NOT NULL,
	`userId` text NOT NULL,
	`paymentRequestId` text,
	`activatedAt` text NOT NULL,
	`expiresAt` text NOT NULL,
	`lastChecked` text,
	`hardwareFp` text,
	`signedPayload` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`keyId`) REFERENCES `licensekey`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`paymentRequestId`) REFERENCES `paymentrequest`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `License_userId_idx` ON `license` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `License_paymentRequestId_key` ON `license` (`paymentRequestId`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `License_userId_key` ON `license` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `License_keyId_key` ON `license` (`keyId`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `licensekey` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`type` text NOT NULL,
	`durationDays` integer NOT NULL,
	`maxCameras` integer DEFAULT -1 NOT NULL,
	`maxPeople` integer DEFAULT -1 NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`batchName` text,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `LicenseKey_key_idx` ON `licensekey` (`key`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `LicenseKey_key_key` ON `licensekey` (`key`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `maintenancerequest` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`licenseId` text,
	`description` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`proofPublicId` text,
	`proofUrl` text,
	`adminNote` text,
	`hasPaidLicense` integer DEFAULT false NOT NULL,
	`totalPrice` real,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`licenseId`) REFERENCES `license`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `notification` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`link` text,
	`read` integer DEFAULT false NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `Notification_userId_read_idx` ON `notification` (`userId`,`read`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `paymentinfo` (
	`id` text PRIMARY KEY NOT NULL,
	`iban` text NOT NULL,
	`accountName` text NOT NULL,
	`bankName` text,
	`reference` text,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `paymentrequest` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`planId` text NOT NULL,
	`paymentInfoId` text NOT NULL,
	`proofPublicId` text NOT NULL,
	`proofUrl` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`adminNote` text,
	`selectedFeatures` text,
	`selectedServices` text,
	`totalPrice` real,
	`durationDays` integer DEFAULT 30 NOT NULL,
	`createdAt` text NOT NULL,
	`reviewedAt` text,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`planId`) REFERENCES `plan`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`paymentInfoId`) REFERENCES `paymentinfo`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `PaymentRequest_userId_idx` ON `paymentrequest` (`userId`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `plan` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`basePrice` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`durationDays` integer NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`isDefault` integer DEFAULT false NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `planfeature` (
	`id` text PRIMARY KEY NOT NULL,
	`planId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` real DEFAULT 0 NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`planId`) REFERENCES `plan`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `PlanFeature_planId_name_key` ON `planfeature` (`planId`,`name`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `planservice` (
	`id` text PRIMARY KEY NOT NULL,
	`planId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` real DEFAULT 0 NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`planId`) REFERENCES `plan`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `PlanService_planId_name_key` ON `planservice` (`planId`,`name`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `subprofile` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`avatarColor` text DEFAULT '#2C9ED5' NOT NULL,
	`pinHash` text,
	`isDefault` integer DEFAULT false NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `SubProfile_userId_idx` ON `subprofile` (`userId`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`passwordHash` text NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`phone` text,
	`pinHash` text,
	`totpSecret` text,
	`totpEnabled` integer DEFAULT false NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `User_email_key` ON `user` (`email`);
