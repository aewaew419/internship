/**
 * Input Sanitization Utilities
 * Provides comprehensive input sanitization to prevent XSS and injection attacks
 */

// HTML entities for escaping
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
  '=': '&#x3D;'
};

/**
 * Escapes HTML characters to prevent XSS attacks
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  return input.replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitizes user input by removing potentially dangerous characters
 */
export function sanitizeInput(input: string, options: {
  allowHtml?: boolean;
  maxLength?: number;
  allowedChars?: RegExp;
} = {}): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  // Apply length limit
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  // Remove HTML if not allowed
  if (!options.allowHtml) {
    sanitized = escapeHtml(sanitized);
  }

  // Apply character filtering
  if (options.allowedChars) {
    sanitized = sanitized.replace(options.allowedChars, '');
  }

  return sanitized;
}

/**
 * Sanitizes student ID input (numeric only)
 */
export function sanitizeStudentId(input: string): string {
  return input.replace(/\D/g, '').substring(0, 10);
}

/**
 * Sanitizes email input
 */
export function sanitizeEmail(input: string): string {
  return sanitizeInput(input, {
    maxLength: 254,
    allowedChars: /[^a-zA-Z0-9@._-]/g
  }).toLowerCase();
}

/**
 * Sanitizes name input (Thai and English characters only)
 */
export function sanitizeName(input: string): string {
  return sanitizeInput(input, {
    maxLength: 50,
    allowedChars: /[^a-zA-Zก-๙\s\-\.]/g
  });
}

/**
 * Sanitizes password input (removes control characters)
 */
export function sanitizePassword(input: string): string {
  // Remove control characters but keep printable characters
  return input.replace(/[\x00-\x1F\x7F]/g, '').substring(0, 128);
}

/**
 * Deep sanitizes an object recursively
 */
export function deepSanitize<T extends Record<string, any>>(
  obj: T,
  sanitizers: Partial<Record<keyof T, (value: any) => any>> = {}
): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    const typedKey = key as keyof T;
    
    if (sanitizers[typedKey]) {
      sanitized[typedKey] = sanitizers[typedKey]!(value);
    } else if (typeof value === 'string') {
      sanitized[typedKey] = sanitizeInput(value) as T[keyof T];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[typedKey] = deepSanitize(value, sanitizers[typedKey] as any);
    } else {
      sanitized[typedKey] = value;
    }
  }

  return sanitized;
}

/**
 * Validates and sanitizes authentication form data
 */
export function sanitizeAuthData<T extends Record<string, any>>(data: T): T {
  const sanitizers: Partial<Record<keyof T, (value: any) => any>> = {
    studentId: sanitizeStudentId,
    email: sanitizeEmail,
    password: sanitizePassword,
    firstName: sanitizeName,
    lastName: sanitizeName,
  } as Partial<Record<keyof T, (value: any) => any>>;

  return deepSanitize(data, sanitizers);
}

/**
 * Removes potentially dangerous SQL injection patterns
 */
export function preventSqlInjection(input: string): string {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(--|\/\*|\*\/|;|'|"|`)/g,
    /(\bOR\b|\bAND\b)\s*\d+\s*=\s*\d+/gi
  ];

  let sanitized = input;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  return sanitized.trim();
}

/**
 * Validates URL to prevent open redirect attacks
 */
export function sanitizeRedirectUrl(url: string, allowedDomains: string[] = []): string | null {
  try {
    // If it's a relative URL, it's safe
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }

    const parsedUrl = new URL(url);
    
    // Check if domain is in allowed list
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain => 
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      );
      
      if (!isAllowed) {
        return null;
      }
    }

    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}