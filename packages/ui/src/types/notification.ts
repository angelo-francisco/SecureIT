export type NotificationLevel = "I" | "E" | "S" | "P";

export interface Notification {
	id: number;
	title: string;
	description: string;
	level: NotificationLevel;
	photo?: string;
	camera: number;
	camera_name: string;
	read: boolean;
	created_at: string;
}

export interface NotificationFilter {
	search_query: "A" | "NR" | "R";
}
