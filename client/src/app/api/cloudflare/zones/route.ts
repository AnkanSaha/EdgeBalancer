import { NextRequest, NextResponse } from 'next/server';
import { backendClient } from '@/lib/backend';
import { handleApiError } from '@/lib/apiErrorHandler';

export async function GET(request: NextRequest) {
  try {
    const cookies = request.headers.get('cookie') || '';
    const response = await backendClient.proxyRequest('GET', '/api/cloudflare/zones', undefined, cookies);

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    return handleApiError(error);
  }
}
