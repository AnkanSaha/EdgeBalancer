import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MARKDOWN_404 = `# 404 - Page Not Found

The page you are looking for does not exist or has been moved.

## Where to go next

- [Home](https://edge.nexoral.in/) - Dashboard and overview
- [Features](https://edge.nexoral.in/features) - 7 LB strategies + 9 gateway features
- [Pricing](https://edge.nexoral.in/pricing) - Free / Student / Pro plans
- [API Documentation](https://edge.nexoral.in/openapi.json) - OpenAPI 3.1 spec
- [Developer Portal](https://edge.nexoral.in/developers) - Quickstart, API keys, docs
- [LLMs.txt](https://edge.nexoral.in/llms.txt) - Agent instructions
- [Sitemap](https://edge.nexoral.in/sitemap.xml) - All available pages
- [Contact](https://edge.nexoral.in/contact) - Get in touch
`;

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Vary', 'Accept, Accept-Encoding');

  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/markdown') || accept.includes('text/plain')) {
    response.headers.set('Content-Type', 'text/markdown; charset=utf-8');
  }

  return response;
}

export const config = {
  matcher: '/:path*',
};
