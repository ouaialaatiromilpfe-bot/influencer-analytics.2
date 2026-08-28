import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    const response = await fetch(
      'https://instagram-scraper-stable-api.p.rapidapi.com/get_ig_user_followers_v2.php',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
          'x-rapidapi-host': 'instagram-scraper-stable-api.p.rapidapi.com',
        },
        body: new URLSearchParams({
          username_or_url: username,
          data: 'info',
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch Instagram profile' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}