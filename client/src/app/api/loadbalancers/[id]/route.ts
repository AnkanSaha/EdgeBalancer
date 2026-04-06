import { NextRequest, NextResponse } from 'next/server';
import { backendClient } from '@/lib/backend';
import { handleApiError } from '@/lib/apiErrorHandler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookies = request.headers.get('cookie') || '';
    const response = await backendClient.proxyRequest('GET', `/api/loadbalancers/${id}`, undefined, cookies);

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const cookies = request.headers.get('cookie') || '';
    const operationId = request.headers.get('x-operation-id');
    const response = await backendClient.proxyRequest(
      'PUT',
      `/api/loadbalancers/${id}`,
      body,
      cookies,
      request.signal,
      operationId ? { 'x-operation-id': operationId } : undefined
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookies = request.headers.get('cookie') || '';
    const response = await backendClient.proxyRequest('DELETE', `/api/loadbalancers/${id}`, undefined, cookies);

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    return handleApiError(error);
  }
}
