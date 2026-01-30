import { NextResponse } from 'next/server';

const ICAL_URL = 'https://secure.justworks.com/calendar/ical/e36485b67b86bb97c564fb387b219392';

export async function GET() {
  try {
    const response = await fetch(ICAL_URL);
    const icalData = await response.text();

    return NextResponse.json({ data: icalData });
  } catch (error) {
    console.error('Error fetching iCal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}
