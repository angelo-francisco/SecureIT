import { relations } from "drizzle-orm/relations";
import { paymentRequest, license, user, licenseKey, paymentInfo, plan, subProfile, planFeature, planService, maintenanceRequest, notification } from "./schema";

export const licenseRelations = relations(license, ({one, many}) => ({
	paymentRequest: one(paymentRequest, {
		fields: [license.paymentRequestId],
		references: [paymentRequest.id]
	}),
	user: one(user, {
		fields: [license.userId],
		references: [user.id]
	}),
	licenseKey: one(licenseKey, {
		fields: [license.keyId],
		references: [licenseKey.id]
	}),
	maintenanceRequests: many(maintenanceRequest),
}));

export const paymentRequestRelations = relations(paymentRequest, ({one, many}) => ({
	licenses: many(license),
	paymentInfo: one(paymentInfo, {
		fields: [paymentRequest.paymentInfoId],
		references: [paymentInfo.id]
	}),
	plan: one(plan, {
		fields: [paymentRequest.planId],
		references: [plan.id]
	}),
	user: one(user, {
		fields: [paymentRequest.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	licenses: many(license),
	paymentRequests: many(paymentRequest),
	subProfiles: many(subProfile),
	maintenanceRequests: many(maintenanceRequest),
	notifications: many(notification),
}));

export const licenseKeyRelations = relations(licenseKey, ({many}) => ({
	licenses: many(license),
}));

export const paymentInfoRelations = relations(paymentInfo, ({many}) => ({
	paymentRequests: many(paymentRequest),
}));

export const planRelations = relations(plan, ({many}) => ({
	paymentRequests: many(paymentRequest),
	planFeatures: many(planFeature),
	planServices: many(planService),
}));

export const subProfileRelations = relations(subProfile, ({one}) => ({
	user: one(user, {
		fields: [subProfile.userId],
		references: [user.id]
	}),
}));

export const planFeatureRelations = relations(planFeature, ({one}) => ({
	plan: one(plan, {
		fields: [planFeature.planId],
		references: [plan.id]
	}),
}));

export const planServiceRelations = relations(planService, ({one}) => ({
	plan: one(plan, {
		fields: [planService.planId],
		references: [plan.id]
	}),
}));

export const maintenanceRequestRelations = relations(maintenanceRequest, ({one}) => ({
	license: one(license, {
		fields: [maintenanceRequest.licenseId],
		references: [license.id]
	}),
	user: one(user, {
		fields: [maintenanceRequest.userId],
		references: [user.id]
	}),
}));

export const notificationRelations = relations(notification, ({one}) => ({
	user: one(user, {
		fields: [notification.userId],
		references: [user.id]
	}),
}));