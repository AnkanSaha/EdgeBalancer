import { NextRequest, NextResponse } from 'next/server';
import { backendClient } from '@/lib/backend';
import { handleApiError } from '@/lib/apiErrorHandler';

export async function POST(request: NextRequest) {
  try {
    const cookies = request.headers.get('cookie') || '';
    const response = await backendClient.proxyRequest('POST', '/api/auth/logout', undefined, cookies);

    // Forward cookie clearing from backend to client
    const nextResponse = NextResponse.json(response.data, { status: response.status });
    const responseCookies = response.headers['set-cookie'];
    if (responseCookies) {
      responseCookies.forEach((cookie: string) => {
        nextResponse.headers.append('Set-Cookie', cookie);
      });
    }

    return nextResponse;
  } catch (error: any) {
    return handleApiError(error);
  }
}
