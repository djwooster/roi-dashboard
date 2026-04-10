import { ghlFetch } from "./api";
import type { GHLAppointment } from "./types";
import type { GHLDateRange } from "./fetchLocationData";

// Shape of the GHL calendar events API response.
// The API returns `events` at the top level; total is not always present.
type GHLEventsResponse = {
  events?: GHLAppointment[];
  total?: number;
};

// Fetches calendar appointments for a GHL location.
// Used by fetchLocationData to populate the "Booked" stage of the funnel.
//
// Why a separate file: this scope (calendars.readonly) lives on the GHL
// sub-account app, not the agency app. Isolating the fetch makes it easy
// to swap endpoints or handle scope errors without affecting core KPI fetches.
//
// Returns an empty result on any failure — the calendars.readonly scope must
// be added to the GHL sub-account app for this to return real data.
export async function fetchAppointments(
  locationId: string,
  token: string,
  dateRange?: GHLDateRange,
): Promise<{ count: number; appointments: GHLAppointment[] }> {
  try {
    // GHL calendar events use epoch milliseconds for startTime/endTime.
    // Default to the last 30 days when no explicit range is provided.
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    const startTime = dateRange?.from
      ? new Date(dateRange.from).getTime()
      : now - thirtyDaysMs;

    // Add 1 day - 1ms to make "to" date inclusive through end of day
    const endTime = dateRange?.to
      ? new Date(dateRange.to).getTime() + 24 * 60 * 60 * 1000 - 1
      : now;

    const res = await ghlFetch(
      `/calendars/events?locationId=${locationId}&startTime=${startTime}&endTime=${endTime}`,
      token,
    );

    if (!res.ok) return { count: 0, appointments: [] };

    const data = await res.json() as GHLEventsResponse;
    const appointments = data.events ?? [];
    return { count: appointments.length, appointments };
  } catch {
    // Calendar scope not granted, endpoint not available, or network error.
    // The funnel will show 0 for "Booked" until the scope is added to the GHL sub-account app.
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
