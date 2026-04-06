import { NextRequest, NextResponse } from 'next/server';
import { backendClient } from '@/lib/backend';
import { handleApiError } from '@/lib/apiErrorHandler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const cookies = request.headers.get('cookie') || '';
    const response = await backendClient.proxyRequest(
      'POST',
      `/api/loadbalancers/${id}/pause`,
      body,
      cookies
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    return handleApiError(error);
  }
}
