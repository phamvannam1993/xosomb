export function xmlEntityDecode(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

export function stripHtml(value: string) {
  return xmlEntityDecode(value)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/tr>/gi, ' ')
    .replace(/<\/div>/gi, ' ')
    .replace(/<\/h[1-6]>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeForCompare(value: string) {
  return stripHtml(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function absoluteXsktUrl(href: string, baseUrl = 'https://xskt.com.vn') {
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith('/')) return `${baseUrl}${href}`;
  return `${baseUrl}/${href}`;
}
