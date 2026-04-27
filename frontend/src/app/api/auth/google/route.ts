import { NextRequest, NextResponse } from 'next/server';

function resolveBackendUrl() {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000/api'
  );
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: { message: 'No token provided' } },
        { status: 400 }
      );
    }

    // Forward Google token to backend
    const backendUrl = resolveBackendUrl();
    const response = await fetch(`${backendUrl}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data);
    const headersWithCookies = response.headers as Headers & {
      getSetCookie?: () => string[];
    };
    const setCookies =
      typeof headersWithCookies.getSetCookie === 'function'
        ? headersWithCookies.getSetCookie()
        : [];

    if (setCookies.length > 0) {
      for (const cookie of setCookies) {
        nextResponse.headers.append('set-cookie', cookie);
      }
    } else {
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        nextResponse.headers.set('set-cookie', setCookie);
      }
    }

    return nextResponse;
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
