/**
 * Basic HTML sanitization - removes potentially dangerous tags and scripts
 * For production, consider using a library like DOMPurify
 */
export function sanitizeHTML(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .substring(0, 5000); // Enforce max length
}

/**
 * Sanitize text for LINE messages - removes HTML and limits length
 */
export function sanitizeForLINE(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .substring(0, 5000); // LINE message length limit
}

/**
 * Validate and sanitize URL - ensures it's from trusted domain
 */
export function validateURL(url: string, allowedDomains: string[]): string {
  try {
    const parsedUrl = new URL(url);
    const isAllowed = allowedDomains.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );
    
    if (!isAllowed) {
      throw new Error('URL from untrusted domain');
    }
    
    return url;
  } catch (error) {
    throw new Error('Invalid URL format');
  }
}

/**
 * Validate and sanitize input with length limits
 */
export function validateInput(input: string, maxLength: number): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.trim().substring(0, maxLength);
}
