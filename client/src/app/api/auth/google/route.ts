import { NextRequest, NextResponse } from 'next/server';
import { backendClient } from '@/lib/backend';
import { handleApiError, validateRequestBody } from '@/lib/apiErrorHandler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationError = validateRequestBody(body, ['idToken']);
    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      );
    }

    const response = await backendClient.proxyRequest('POST', '/api/auth/google', body);

    const nextResponse = NextResponse.json(response.data, { status: response.status });
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      cookies.forEach((cookie: string) => {
        nextResponse.headers.append('Set-Cookie', cookie);
      });
    }

    return nextResponse;
  } catch (error: any) {
    return handleApiError(error);
  }
}
