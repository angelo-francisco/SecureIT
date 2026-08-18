import { type ClassValue, clsx } from "clsx";
// @ts-ignore
import { addLocale, humanizeDate } from "datehumanizer";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

let initialized = false;

function initializePortugueseLocale() {
	if (initialized) return;

	addLocale("pt", {
		just_now: "agora mesmo",
		seconds_ago: "há {count} segundos",
		minute_ago: "há um minuto",
		minutes_ago: "há {count} minutos",
		hour_ago: "há uma hora",
		hours_ago: "há {count} horas",
		yesterday: "ontem",
		days_ago: "há {count} dias",
		last_week: "na semana passada",
		weeks_ago: "há {count} semanas",
		last_month: "no mês passado",
		months_ago: "há {count} meses",
		last_year: "no ano passado",
		years_ago: "há {count} anos",

		in_seconds: "daqui a {count} segundos",
		in_minute: "daqui a um minuto",
		in_minutes: "daqui a {count} minutos",
		in_hour: "daqui a uma hora",
		in_hours: "daqui a {count} horas",
		tomorrow: "amanhã",
		in_days: "daqui a {count} dias",
		in_week: "daqui a uma semana",
		in_weeks: "daqui a {count} semanas",
		in_month: "daqui a um mês",
		in_months: "daqui a {count} meses",
		in_year: "daqui a um ano",
		in_years: "daqui a {count} anos",
	});

	initialized = true;
}

export function humanizePortugueseDate(date: Date | string | number) {
	initializePortugueseLocale();

	return humanizeDate(new Date(date), {
		locale: "pt",
	});
}
