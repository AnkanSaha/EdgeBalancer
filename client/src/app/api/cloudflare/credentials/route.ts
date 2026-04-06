import { NextRequest, NextResponse } from 'next/server';
import { backendClient } from '@/lib/backend';
import { handleApiError, validateRequestBody } from '@/lib/apiErrorHandler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const validationError = validateRequestBody(body, ['accountId', 'apiToken']);
    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      );
    }

    const cookies = request.headers.get('cookie') || '';
    const response = await backendClient.proxyRequest('POST', '/api/cloudflare/credentials', body, cookies);

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const validationError = validateRequestBody(body, ['accountId', 'apiToken']);
    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      );
    }

    const cookies = request.headers.get('cookie') || '';
    const response = await backendClient.proxyRequest('PUT', '/api/cloudflare/credentials', body, cookies);

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookies = request.headers.get('cookie') || '';
    const response = await backendClient.proxyRequest('GET', '/api/cloudflare/credentials', undefined, cookies);

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    return handleApiError(error);
  }
}
