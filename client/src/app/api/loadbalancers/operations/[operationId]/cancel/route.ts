import { NextRequest, NextResponse } from 'next/server';
import { backendClient } from '@/lib/backend';
import { handleApiError } from '@/lib/apiErrorHandler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ operationId: string }> }
) {
  try {
    const { operationId } = await params;
    const cookies = request.headers.get('cookie') || '';
    const response = await backendClient.proxyRequest(
      'POST',
      `/api/loadbalancers/operations/${operationId}/cancel`,
      undefined,
      cookies
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    return handleApiError(error);
  }
}
