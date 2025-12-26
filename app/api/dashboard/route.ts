import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Test GET handler
export async function GET() {
  return NextResponse.json({ message: 'API route is working', status: 'ok' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Forward the request to the webhook
    const response = await fetch(
      'https://n8n.benai.agency/webhook/8aca6b12-9734-4ead-a836-a0ef46f94293',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to send data to webhook', status: response.status },
        { status: response.status }
      );
    }

    // Try to parse JSON, but handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const responseText = await response.text();
      // Try to parse JSON, handle empty responses
      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', responseText);
          data = { message: responseText || 'Response received' };
        }
      } else {
        // Empty response
        data = { message: 'Response received (empty)' };
      }
    } else {
      const text = await response.text();
      data = { message: text || 'Success' };
    }

    // Log the response for debugging
    console.log('Webhook response:', data);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

