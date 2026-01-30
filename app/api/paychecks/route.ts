import { NextResponse } from 'next/server';

const ICAL_URL = 'https://secure.justworks.com/calendar/ical/e36485b67b86bb97c564fb387b219392';

export async function GET() {
  try {
    const response = await fetch(ICAL_URL);

    if (!response.ok) {
      console.error('iCal fetch failed:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch calendar: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const icalData = await response.text();

    // Check if we got HTML instead of iCal data
    if (icalData.trim().startsWith('<!DOCTYPE') || icalData.trim().startsWith('<html')) {
      console.error('Received HTML instead of iCal data');
      return NextResponse.json(
        { error: 'Calendar feed returned HTML instead of calendar data. Check if the URL requires authentication.' },
        { status: 400 }
      );
    }

    // Check if it looks like valid iCal data
    if (!icalData.includes('BEGIN:VCALENDAR')) {
      console.error('Invalid iCal data received');
      return NextResponse.json(
        { error: 'Invalid calendar data received' },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: icalData });
  } catch (error) {
    console.error('Error fetching iCal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}
