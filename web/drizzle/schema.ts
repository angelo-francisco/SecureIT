import { sqliteTable, AnySQLiteColumn, uniqueIndex, text, numeric, index, integer, foreignKey, real } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const user = sqliteTable("User", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text().notNull(),
	firstName: text().notNull(),
	lastName: text().notNull(),
	phone: text(),
	pinHash: text(),
	totpSecret: text(),
	totpEnabled: numeric().notNull(),
	isActive: numeric().default(true).notNull(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	uniqueIndex("User_email_key").on(table.email),
]);

export const licenseKey = sqliteTable("LicenseKey", {
	id: text().primaryKey().notNull(),
	key: text().notNull(),
	type: text().notNull(),
	durationDays: integer().notNull(),
	maxCameras: integer().default(-1).notNull(),
	maxPeople: integer().default(-1).notNull(),
	status: text().default("PENDING").notNull(),
	batchName: text(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("LicenseKey_key_idx").on(table.key),
	uniqueIndex("LicenseKey_key_key").on(table.key),
]);

export const license = sqliteTable("License", {
	id: text().primaryKey().notNull(),
	keyId: text().notNull().references(() => licenseKey.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	userId: text().notNull().references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	paymentRequestId: text().references(() => paymentRequest.id, { onDelete: "set null", onUpdate: "cascade" } ),
	activatedAt: numeric().notNull(),
	expiresAt: numeric().notNull(),
	lastChecked: numeric(),
	hardwareFp: text(),
	signedPayload: text(),
	status: text().default("ACTIVE").notNull(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("License_userId_idx").on(table.userId),
	uniqueIndex("License_paymentRequestId_key").on(table.paymentRequestId),
	uniqueIndex("License_userId_key").on(table.userId),
	uniqueIndex("License_keyId_key").on(table.keyId),
]);

export const adminUser = sqliteTable("AdminUser", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text().notNull(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	uniqueIndex("AdminUser_email_key").on(table.email),
]);

export const emailCode = sqliteTable("EmailCode", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	code: text().notNull(),
	expiresAt: numeric().notNull(),
	used: numeric().notNull(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("EmailCode_email_code_idx").on(table.email, table.code),
]);

export const plan = sqliteTable("Plan", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	basePrice: real().notNull(),
	currency: text().default("USD").notNull(),
	durationDays: integer().notNull(),
	isActive: numeric().default(true).notNull(),
	isDefault: numeric().notNull(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric().notNull(),
});

export const paymentInfo = sqliteTable("PaymentInfo", {
	id: text().primaryKey().notNull(),
	iban: text().notNull(),
	accountName: text().notNull(),
	bankName: text(),
	isActive: numeric().default(true).notNull(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	reference: text(),
});

export const paymentRequest = sqliteTable("PaymentRequest", {
	id: text().primaryKey().notNull(),
	userId: text().notNull().references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	planId: text().notNull().references(() => plan.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	paymentInfoId: text().notNull().references(() => paymentInfo.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	proofPublicId: text().notNull(),
	proofUrl: text().notNull(),
	status: text().default("PENDING").notNull(),
	adminNote: text(),
	selectedFeatures: text(),
	selectedServices: text(),
	totalPrice: real(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	reviewedAt: numeric(),
},
(table) => [
	index("PaymentRequest_userId_idx").on(table.userId),
]);

export const subProfile = sqliteTable("SubProfile", {
	id: text().primaryKey().notNull(),
	userId: text().notNull().references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	name: text().notNull(),
	avatarColor: text().default("#2C9ED5").notNull(),
	pinHash: text(),
	isDefault: numeric().notNull(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("SubProfile_userId_idx").on(table.userId),
]);

export const planFeature = sqliteTable("PlanFeature", {
	id: text().primaryKey().notNull(),
	planId: text().notNull().references(() => plan.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	name: text().notNull(),
	description: text(),
	price: real().notNull(),
	isActive: numeric().default(true).notNull(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	uniqueIndex("PlanFeature_planId_name_key").on(table.planId, table.name),
]);

export const planService = sqliteTable("PlanService", {
	id: text().primaryKey().notNull(),
	planId: text().notNull().references(() => plan.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	name: text().notNull(),
	description: text(),
	price: real().notNull(),
	isActive: numeric().default(true).notNull(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	uniqueIndex("PlanService_planId_name_key").on(table.planId, table.name),
]);

export const maintenanceRequest = sqliteTable("MaintenanceRequest", {
	id: text().primaryKey().notNull(),
	userId: text().notNull().references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	licenseId: text().references(() => license.id, { onDelete: "set null", onUpdate: "cascade" } ),
	description: text().notNull(),
	status: text().default("PENDING").notNull(),
	proofPublicId: text(),
	proofUrl: text(),
	adminNote: text(),
	hasPaidLicense: numeric().notNull(),
	totalPrice: real(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric().notNull(),
});

export const notification = sqliteTable("Notification", {
	id: text().primaryKey().notNull(),
	userId: text().notNull().references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	type: text().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	link: text(),
	read: numeric().notNull(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("Notification_userId_read_idx").on(table.userId, table.read),
]);

