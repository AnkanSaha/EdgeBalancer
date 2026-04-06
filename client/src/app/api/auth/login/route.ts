import { NextRequest, NextResponse } from 'next/server';
import { backendClient } from '@/lib/backend';
import { handleApiError, validateRequestBody } from '@/lib/apiErrorHandler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const validationError = validateRequestBody(body, ['email', 'password']);
    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      );
    }

    const response = await backendClient.proxyRequest('POST', '/api/auth/login', body);

    // Forward cookies from backend to client
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
