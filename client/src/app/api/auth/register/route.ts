import { NextRequest, NextResponse } from 'next/server';
import { backendClient } from '@/lib/backend';
import { handleApiError, validateRequestBody } from '@/lib/apiErrorHandler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const validationError = validateRequestBody(body, ['name', 'email', 'password']);
    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      );
    }

    const response = await backendClient.proxyRequest('POST', '/api/auth/register', body);

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    return handleApiError(error);
  }
}
