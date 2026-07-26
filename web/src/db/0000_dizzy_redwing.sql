CREATE TABLE `AdminUser` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`passwordHash` text NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `AdminUser_email_key` ON `AdminUser` (`email`);--> statement-breakpoint
CREATE TABLE `EmailCode` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`expiresAt` text NOT NULL,
	`used` integer DEFAULT false NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `EmailCode_email_code_idx` ON `EmailCode` (`email`,`code`);--> statement-breakpoint
CREATE TABLE `License` (
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
	FOREIGN KEY (`keyId`) REFERENCES `LicenseKey`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`paymentRequestId`) REFERENCES `PaymentRequest`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `License_userId_idx` ON `License` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `License_paymentRequestId_key` ON `License` (`paymentRequestId`);--> statement-breakpoint
CREATE UNIQUE INDEX `License_userId_key` ON `License` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `License_keyId_key` ON `License` (`keyId`);--> statement-breakpoint
CREATE TABLE `LicenseKey` (
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
CREATE INDEX `LicenseKey_key_idx` ON `LicenseKey` (`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `LicenseKey_key_key` ON `LicenseKey` (`key`);--> statement-breakpoint
CREATE TABLE `MaintenanceRequest` (
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
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`licenseId`) REFERENCES `License`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `Notification` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`link` text,
	`read` integer DEFAULT false NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `Notification_userId_read_idx` ON `Notification` (`userId`,`read`);--> statement-breakpoint
CREATE TABLE `PaymentInfo` (
	`id` text PRIMARY KEY NOT NULL,
	`iban` text NOT NULL,
	`accountName` text NOT NULL,
	`bankName` text,
	`reference` text,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `PaymentRequest` (
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
	`createdAt` text NOT NULL,
	`reviewedAt` text,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`paymentInfoId`) REFERENCES `PaymentInfo`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `PaymentRequest_userId_idx` ON `PaymentRequest` (`userId`);--> statement-breakpoint
CREATE TABLE `Plan` (
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
CREATE TABLE `PlanFeature` (
	`id` text PRIMARY KEY NOT NULL,
	`planId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` real DEFAULT 0 NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `PlanFeature_planId_name_key` ON `PlanFeature` (`planId`,`name`);--> statement-breakpoint
CREATE TABLE `PlanService` (
	`id` text PRIMARY KEY NOT NULL,
	`planId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` real DEFAULT 0 NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `PlanService_planId_name_key` ON `PlanService` (`planId`,`name`);--> statement-breakpoint
CREATE TABLE `SubProfile` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`avatarColor` text DEFAULT '#2C9ED5' NOT NULL,
	`pinHash` text,
	`isDefault` integer DEFAULT false NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `SubProfile_userId_idx` ON `SubProfile` (`userId`);--> statement-breakpoint
CREATE TABLE `User` (
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
CREATE UNIQUE INDEX `User_email_key` ON `User` (`email`);