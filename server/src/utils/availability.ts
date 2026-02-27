import { db } from '../db.js';
import { startOfWeek, addDays, parse, format, isWithinInterval } from 'date-fns';

interface Event {
  id: number;
  title: string;
  type: 'one-time' | 'recurring';
  date?: string;
  day_of_week?: number;
  start_time: string;
  end_time: string;
}

interface Settings {
  available_start: string;
  available_end: string;
  available_days: number[];
  timezone: string;
  slot_duration: number;
}

interface TimeSlot {
  start: string;
  end: string;
}

interface DayAvailability {
  date: string;
  dayOfWeek: number;
  slots: TimeSlot[];
}

function getSettings(): Settings {
  const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;

  const settings: any = {};
  rows.forEach(row => {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  });

  return {
    available_start: settings.available_start || '09:00',
    available_end: settings.available_end || '18:00',
    available_days: settings.available_days || [1, 2, 3, 4, 5],
    timezone: settings.timezone || 'Asia/Shanghai',
    slot_duration: parseInt(settings.slot_duration) || 30,
  };
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function getBusyEventsForDate(date: string, dayOfWeek: number): Event[] {
  // Get one-time events for this specific date
  const oneTimeEvents = db.prepare('SELECT * FROM events WHERE type = ? AND date = ?')
    .all('one-time', date) as Event[];

  // Get recurring events for this day of week
  const recurringEvents = db.prepare('SELECT * FROM events WHERE type = ? AND day_of_week = ?')
    .all('recurring', dayOfWeek) as Event[];

  return [...oneTimeEvents, ...recurringEvents];
}

function calculateFreeSlots(
  availableStart: string,
  availableEnd: string,
  busyEvents: Event[],
  slotDuration: number
): TimeSlot[] {
  const startMinutes = timeToMinutes(availableStart);
  const endMinutes = timeToMinutes(availableEnd);

  // Convert busy events to time ranges
  const busyRanges = busyEvents
    .map(event => ({
      start: timeToMinutes(event.start_time),
      end: timeToMinutes(event.end_time),
    }))
    .sort((a, b) => a.start - b.start);

  // Find free slots
  const freeSlots: TimeSlot[] = [];
  let currentTime = startMinutes;

  for (const busy of busyRanges) {
    // If there's a gap before this busy period
    if (currentTime < busy.start) {
      // Split into slot_duration chunks
      let slotStart = currentTime;
      while (slotStart + slotDuration <= busy.start) {
        freeSlots.push({
          start: minutesToTime(slotStart),
          end: minutesToTime(slotStart + slotDuration),
        });
        slotStart += slotDuration;
      }
    }
    currentTime = Math.max(currentTime, busy.end);
  }

  // Handle remaining time after last busy period
  if (currentTime < endMinutes) {
    let slotStart = currentTime;
    while (slotStart + slotDuration <= endMinutes) {
      freeSlots.push({
        start: minutesToTime(slotStart),
        end: minutesToTime(slotStart + slotDuration),
      });
      slotStart += slotDuration;
    }
  }

  return freeSlots;
}

export function getWeekAvailability(weekOfDate: string): DayAvailability[] {
  const settings = getSettings();
  const weekStart = startOfWeek(parse(weekOfDate, 'yyyy-MM-dd', new Date()), { weekStartsOn: 0 });

  const availability: DayAvailability[] = [];

  for (let i = 0; i < 7; i++) {
    const currentDate = addDays(weekStart, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayOfWeek = currentDate.getDay();

    // Check if this day is available
    if (!settings.available_days.includes(dayOfWeek)) {
      continue;
    }

    // Get busy events for this day
    const busyEvents = getBusyEventsForDate(dateStr, dayOfWeek);

    // Calculate free slots
    const slots = calculateFreeSlots(
      settings.available_start,
      settings.available_end,
      busyEvents,
      settings.slot_duration
    );

    availability.push({
      date: dateStr,
      dayOfWeek,
      slots,
    });
  }

  return availability;
}

