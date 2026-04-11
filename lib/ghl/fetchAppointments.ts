import { ghlFetch } from "./api";
import type { GHLAppointment } from "./types";
import type { GHLDateRange } from "./fetchLocationData";

// Shape of the GHL calendar events API response.
// The API returns `events` at the top level; total is not always present.
type GHLEventsResponse = {
  events?: GHLAppointment[];
  total?: number;
};

type GHLCalendar = { id: string; name?: string };
type GHLCalendarsResponse = { calendars?: GHLCalendar[] };

// Fetches calendar appointments for a GHL location.
// Used by fetchLocationData to populate the "Booked" stage of the funnel.
//
// Why two-step: GHL's /calendars/events endpoint requires calendarId, userId,
// or groupId — locationId alone returns a 422. So we first fetch all calendars
// for the location, then fetch events per calendar and merge the results.
//
// Returns an empty result on any failure — the calendars/events.readonly scope
// must be on the GHL sub-account app for this to return real data.
export async function fetchAppointments(
  locationId: string,
  token: string,
  dateRange?: GHLDateRange,
): Promise<{ count: number; appointments: GHLAppointment[] }> {
  try {
    // GHL calendar events use epoch milliseconds for startTime/endTime.
    // Default window: 30 days back to 14 days forward so the med spa owner
    // sees upcoming appointments they haven't confirmed yet, not just past ones.
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    const startTime = dateRange?.from
      ? new Date(dateRange.from).getTime()
      : now - thirtyDaysMs;

    // Add 1 day - 1ms to make "to" date inclusive through end of day
    const endTime = dateRange?.to
      ? new Date(dateRange.to).getTime() + 24 * 60 * 60 * 1000 - 1
      : now + fourteenDaysMs;

    // Step 1: Get all calendars for this location
    const calendarsRes = await ghlFetch(`/calendars/?locationId=${locationId}`, token);
    if (!calendarsRes.ok) {
      console.error(`[fetchAppointments] calendars fetch ${calendarsRes.status}`);
      return { count: 0, appointments: [] };
    }

    const calendarsData = await calendarsRes.json() as GHLCalendarsResponse;
    const calendars = calendarsData.calendars ?? [];

    if (calendars.length === 0) return { count: 0, appointments: [] };

    // Step 2: Fetch events for each calendar in parallel, then merge
    const results = await Promise.all(
      calendars.map(async (cal) => {
        const res = await ghlFetch(
          `/calendars/events?calendarId=${cal.id}&locationId=${locationId}&startTime=${startTime}&endTime=${endTime}`,
          token,
        );
        if (!res.ok) return [];
        const data = await res.json() as GHLEventsResponse;
        return data.events ?? [];
      })
    );

    const appointments = results.flat();
    return { count: appointments.length, appointments };
  } catch (err) {
    console.error("[fetchAppointments] threw:", err);
    return { count: 0, appointments: [] };
  }
}

// Returns a display name for an appointment, preferring the nested contact
// name over the title field (which can be a service name rather than a person).
export function getAppointmentContactName(appt: GHLAppointment): string {
  return appt.contact?.name ?? appt.title ?? "Unknown Contact";
}

// Returns the appointment start time as a Date, handling both ISO strings
// and epoch millisecond values returned by different GHL API versions.
export function getAppointmentDate(appt: GHLAppointment): Date {
  if (typeof appt.startTime === "number") return new Date(appt.startTime);
  return new Date(appt.startTime);
}
