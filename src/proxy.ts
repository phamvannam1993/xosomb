import { NextRequest, NextResponse } from 'next/server';

const CANONICAL_HOST = 'xosomb.vn';
const WWW_HOST = `www.${CANONICAL_HOST}`;

function hostnameFromHeader(hostHeader: string | null) {
  return (hostHeader || '').split(':')[0].toLowerCase();
}

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname.endsWith('.local');
}

function forwardedProtocol(request: NextRequest) {
  return (request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '') || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
}

export function proxy(request: NextRequest) {
  const hostname = hostnameFromHeader(request.headers.get('host'));
  if (!hostname || isLocalHost(hostname)) return NextResponse.next();

  const protocol = forwardedProtocol(request);
  const shouldRedirectHost = hostname === WWW_HOST;
  const shouldRedirectProtocol = hostname === CANONICAL_HOST && protocol === 'http';

  if (!shouldRedirectHost && !shouldRedirectProtocol) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.protocol = 'https:';
  url.hostname = CANONICAL_HOST;
  url.port = '';

  return new NextResponse(null, {
    status: 301,
    headers: {
      Location: url.toString(),
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)']
};
