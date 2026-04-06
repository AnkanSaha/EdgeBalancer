import { NextResponse } from 'next/server';

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
  statusCode?: number;
}

export function handleApiError(error: any): NextResponse {
  console.error('API Error:', error);

  // Network errors
  if (error.code === 'ECONNREFUSED') {
    return NextResponse.json(
      {
        success: false,
        message: 'Backend server is not available. Please try again later.',
      },
      { status: 503 }
    );
  }

  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
    return NextResponse.json(
      {
        success: false,
        message: 'Request timeout. Please try again.',
      },
      { status: 504 }
    );
  }

  // Backend returned an error response
  if (error.response) {
    const status = error.response.status || 500;
    const data = error.response.data || {};

    return NextResponse.json(
      {
        success: false,
        message: data.message || 'An error occurred while processing your request',
        errors: data.errors,
      },
      { status }
    );
  }

  // Request was made but no response received
  if (error.request) {
    return NextResponse.json(
      {
        success: false,
        message: 'No response from server. Please check your connection.',
      },
      { status: 503 }
    );
  }

  // Something else happened
  return NextResponse.json(
    {
      success: false,
      message: error.message || 'An unexpected error occurred',
    },
    { status: 500 }
  );
}

export function validateRequestBody(body: any, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!body[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}
