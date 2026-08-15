ALTER TABLE `user` ADD COLUMN `googleId` text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `User_googleId_key` ON `user` (`googleId`);
