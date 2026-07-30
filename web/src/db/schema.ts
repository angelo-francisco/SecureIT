import {
	sqliteTable,
	text,
	integer,
	real,
	uniqueIndex,
	index,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export function generateId(): string {
	return createId();
}

export const user = sqliteTable(
	"User",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => generateId()),
		email: text("email").notNull(),
		passwordHash: text("passwordHash").notNull(),
		firstName: text("firstName").notNull(),
		lastName: text("lastName").notNull(),
		phone: text("phone"),
		pinHash: text("pinHash"),
		totpSecret: text("totpSecret"),
		totpEnabled: integer("totpEnabled", { mode: "boolean" })
			.notNull()
			.default(false),
		isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(t) => [uniqueIndex("User_email_key").on(t.email)],
);

export const licenseKey = sqliteTable(
	"LicenseKey",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => generateId()),
		key: text("key").notNull(),
		type: text("type").notNull(),
		durationDays: integer("durationDays").notNull(),
		maxCameras: integer("maxCameras").notNull().default(-1),
		maxPeople: integer("maxPeople").notNull().default(-1),
		status: text("status").notNull().default("PENDING"),
		batchName: text("batchName"),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(t) => [
		index("LicenseKey_key_idx").on(t.key),
		uniqueIndex("LicenseKey_key_key").on(t.key),
	],
);

export const license = sqliteTable(
	"License",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => generateId()),
		keyId: text("keyId")
			.notNull()
			.references(() => licenseKey.id, {
				onDelete: "restrict",
				onUpdate: "cascade",
			}),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" }),
		paymentRequestId: text("paymentRequestId").references(
			() => paymentRequest.id,
			{
				onDelete: "set null",
				onUpdate: "cascade",
			},
		),
		activatedAt: text("activatedAt").notNull(),
		expiresAt: text("expiresAt").notNull(),
		lastChecked: text("lastChecked"),
		hardwareFp: text("hardwareFp"),
		signedPayload: text("signedPayload"),
		status: text("status").notNull().default("ACTIVE"),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(t) => [
		index("License_userId_idx").on(t.userId),
		uniqueIndex("License_paymentRequestId_key").on(t.paymentRequestId),
		uniqueIndex("License_userId_key").on(t.userId),
		uniqueIndex("License_keyId_key").on(t.keyId),
	],
);

export const adminUser = sqliteTable(
	"AdminUser",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => generateId()),
		email: text("email").notNull(),
		passwordHash: text("passwordHash").notNull(),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(t) => [uniqueIndex("AdminUser_email_key").on(t.email)],
);

export const emailCode = sqliteTable(
	"EmailCode",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => generateId()),
		email: text("email").notNull(),
		code: text("code").notNull(),
		expiresAt: text("expiresAt").notNull(),
		used: integer("used", { mode: "boolean" }).notNull().default(false),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(t) => [index("EmailCode_email_code_idx").on(t.email, t.code)],
);

export const plan = sqliteTable("Plan", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => generateId()),
	name: text("name").notNull(),
	description: text("description"),
	basePrice: real("basePrice").notNull(),
	currency: text("currency").notNull().default("USD"),
	durationDays: integer("durationDays").notNull(),
	isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
	isDefault: integer("isDefault", { mode: "boolean" }).notNull().default(false),
	createdAt: text("createdAt")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text("updatedAt")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
});

export const paymentInfo = sqliteTable("PaymentInfo", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => generateId()),
	iban: text("iban").notNull(),
	accountName: text("accountName").notNull(),
	bankName: text("bankName"),
	reference: text("reference"),
	isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
	createdAt: text("createdAt")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
});

export const paymentRequest = sqliteTable(
	"PaymentRequest",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => generateId()),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" }),
		planId: text("planId")
			.notNull()
			.references(() => plan.id, { onDelete: "restrict", onUpdate: "cascade" }),
		paymentInfoId: text("paymentInfoId")
			.notNull()
			.references(() => paymentInfo.id, {
				onDelete: "restrict",
				onUpdate: "cascade",
			}),
		proofPublicId: text("proofPublicId").notNull(),
		proofUrl: text("proofUrl").notNull(),
		status: text("status").notNull().default("PENDING"),
		adminNote: text("adminNote"),
		selectedFeatures: text("selectedFeatures"),
		selectedServices: text("selectedServices"),
		totalPrice: real("totalPrice"),
		durationDays: integer("durationDays").notNull().default(30),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
		reviewedAt: text("reviewedAt"),
	},
	(t) => [index("PaymentRequest_userId_idx").on(t.userId)],
);

export const subProfile = sqliteTable(
	"SubProfile",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => generateId()),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" }),
		name: text("name").notNull(),
		avatarColor: text("avatarColor").notNull().default("#2C9ED5"),
		pinHash: text("pinHash"),
		isDefault: integer("isDefault", { mode: "boolean" })
			.notNull()
			.default(false),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(t) => [index("SubProfile_userId_idx").on(t.userId)],
);

export const planFeature = sqliteTable(
	"PlanFeature",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => generateId()),
		planId: text("planId")
			.notNull()
			.references(() => plan.id, { onDelete: "cascade", onUpdate: "cascade" }),
		name: text("name").notNull(),
		description: text("description"),
		price: real("price").notNull().default(0),
		isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(t) => [uniqueIndex("PlanFeature_planId_name_key").on(t.planId, t.name)],
);

export const planService = sqliteTable(
	"PlanService",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => generateId()),
		planId: text("planId")
			.notNull()
			.references(() => plan.id, { onDelete: "cascade", onUpdate: "cascade" }),
		name: text("name").notNull(),
		description: text("description"),
		price: real("price").notNull().default(0),
		isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(t) => [uniqueIndex("PlanService_planId_name_key").on(t.planId, t.name)],
);

export const maintenanceRequest = sqliteTable("MaintenanceRequest", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => generateId()),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" }),
	licenseId: text("licenseId").references(() => license.id, {
		onDelete: "set null",
		onUpdate: "cascade",
	}),
	description: text("description").notNull(),
	status: text("status").notNull().default("PENDING"),
	proofPublicId: text("proofPublicId"),
	proofUrl: text("proofUrl"),
	adminNote: text("adminNote"),
	hasPaidLicense: integer("hasPaidLicense", { mode: "boolean" })
		.notNull()
		.default(false),
	totalPrice: real("totalPrice"),
	createdAt: text("createdAt")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text("updatedAt")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
});

export const notification = sqliteTable(
	"Notification",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => generateId()),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" }),
		type: text("type").notNull(),
		title: text("title").notNull(),
		message: text("message").notNull(),
		link: text("link"),
		read: integer("read", { mode: "boolean" }).notNull().default(false),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(t) => [index("Notification_userId_read_idx").on(t.userId, t.read)],
);
