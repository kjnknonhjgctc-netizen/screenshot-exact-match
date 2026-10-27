/**
 * Date manipulation utilities designed to prevent timezone offsets
 * by strictly using local Date methods.
 */

export const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
export const SHORT_DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
export const SHORT_MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

/**
 * Returns YYYY-MM-DD string for a local Date object.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safely parses YYYY-MM-DD into a local Date object at 00:00:00.
 */
export function parseLocalDateString(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return new Date();
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day, 0, 0, 0, 0);
}

/**
 * Returns a cloned Date with days added or subtracted.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Returns an array of 7 days representing the week around the given reference date (Monday to Sunday).
 */
export function getWeekDays(referenceDate: Date = new Date()): {
  date: Date;
  dateStr: string;
  dayOfWeek: number;
  dayNumber: number;
  shortName: string;
  fullName: string;
  isToday: boolean;
}[] {
  const current = new Date(referenceDate);
  const todayStr = getLocalDateString(new Date());
  
  // Calculate Monday of this week (treating Monday as 1st day of standard work week)
  const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMonday = (dayOfWeek + 6) % 7;
  
  const monday = new Date(current);
  monday.setDate(current.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = getLocalDateString(d);
    const dow = d.getDay();
    days.push({
      date: d,
      dateStr,
      dayOfWeek: dow,
      dayNumber: d.getDate(),
      shortName: SHORT_DAY_NAMES[dow],
      fullName: DAY_NAMES[dow],
      isToday: dateStr === todayStr,
    });
  }
  return days;
}

/**
 * Friendly localized date display.
 */
export function formatFriendlyDate(dateStr: string): string {
  const todayStr = getLocalDateString(new Date());
  const tomorrowStr = getLocalDateString(addDays(new Date(), 1));
  const yesterdayStr = getLocalDateString(addDays(new Date(), -1));

  if (dateStr === todayStr) return 'Hoje';
  if (dateStr === tomorrowStr) return 'Amanhã';
  if (dateStr === yesterdayStr) return 'Ontem';

  const d = parseLocalDateString(dateStr);
  return `${d.getDate()} de ${SHORT_MONTH_NAMES[d.getMonth()]}`;
}

export function formatFullDateHeader(date: Date = new Date()): string {
  const dow = DAY_NAMES[date.getDay()];
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  return `${dow}, ${day} de ${month}`;
}

export function getGreeting(): { greeting: string; subtext: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return {
      greeting: 'Bom dia',
      subtext: 'Vamos avançar um pouco hoje?',
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      greeting: 'Boa tarde',
      subtext: 'Seu objetivo merece sair do papel.',
    };
  } else {
    return {
      greeting: 'Boa noite',
      subtext: 'Um pequeno passo também conta.',
    };
  }
}
