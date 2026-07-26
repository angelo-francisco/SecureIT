import { relations } from "drizzle-orm";
import {
	user,
	license,
	licenseKey,
	paymentRequest,
	paymentInfo,
	plan,
	subProfile,
	planFeature,
	planService,
	maintenanceRequest,
	notification,
} from "./schema";

export const userRelations = relations(user, ({ many }) => ({
	license: many(license),
	profiles: many(subProfile),
	paymentRequests: many(paymentRequest),
	maintenanceRequests: many(maintenanceRequest),
	notifications: many(notification),
}));

export const licenseKeyRelations = relations(licenseKey, ({ one, many }) => ({
	license: one(license, {
		fields: [licenseKey.id],
		references: [license.keyId],
	}),
}));

export const licenseRelations = relations(license, ({ one, many }) => ({
	key: one(licenseKey, {
		fields: [license.keyId],
		references: [licenseKey.id],
	}),
	user: one(user, {
		fields: [license.userId],
		references: [user.id],
	}),
	paymentRequest: one(paymentRequest, {
		fields: [license.paymentRequestId],
		references: [paymentRequest.id],
	}),
	maintenanceRequests: many(maintenanceRequest),
}));

export const planRelations = relations(plan, ({ many }) => ({
	paymentRequests: many(paymentRequest),
	features: many(planFeature),
	services: many(planService),
}));

export const paymentInfoRelations = relations(paymentInfo, ({ many }) => ({
	paymentRequests: many(paymentRequest),
}));

export const paymentRequestRelations = relations(paymentRequest, ({ one }) => ({
	user: one(user, {
		fields: [paymentRequest.userId],
		references: [user.id],
	}),
	plan: one(plan, {
		fields: [paymentRequest.planId],
		references: [plan.id],
	}),
	paymentInfo: one(paymentInfo, {
		fields: [paymentRequest.paymentInfoId],
		references: [paymentInfo.id],
	}),
	license: one(license, {
		fields: [paymentRequest.id],
		references: [license.paymentRequestId],
	}),
}));

export const subProfileRelations = relations(subProfile, ({ one }) => ({
	user: one(user, {
		fields: [subProfile.userId],
		references: [user.id],
	}),
}));

export const planFeatureRelations = relations(planFeature, ({ one }) => ({
	plan: one(plan, {
		fields: [planFeature.planId],
		references: [plan.id],
	}),
}));

export const planServiceRelations = relations(planService, ({ one }) => ({
	plan: one(plan, {
		fields: [planService.planId],
		references: [plan.id],
	}),
}));

export const maintenanceRequestRelations = relations(
	maintenanceRequest,
	({ one }) => ({
		user: one(user, {
			fields: [maintenanceRequest.userId],
			references: [user.id],
		}),
		license: one(license, {
			fields: [maintenanceRequest.licenseId],
			references: [license.id],
		}),
	}),
);

export const notificationRelations = relations(notification, ({ one }) => ({
	user: one(user, {
		fields: [notification.userId],
		references: [user.id],
	}),
}));
