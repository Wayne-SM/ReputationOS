import QRCode from 'qrcode';

export interface QrOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

const DEFAULT_OPTIONS: QrOptions = {
  width: 512,
  margin: 2,
  errorCorrectionLevel: 'M',
  color: {
    dark: '#000000',
    light: '#ffffff',
  },
};

/**
 * Generate a PNG Data URL for browser display/preview
 */
export async function generateQrDataUrl(
  text: string,
  options: QrOptions = {},
): Promise<string> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  return QRCode.toDataURL(text, mergedOptions);
}

/**
 * Generate a vector SVG string for crisp, infinite-resolution print design
 */
export async function generateQrSvg(
  text: string,
  options: QrOptions = {},
): Promise<string> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  return QRCode.toString(text, {
    ...mergedOptions,
    type: 'svg',
  });
}

/**
 * Generate a high-resolution PNG buffer for file downloads
 */
export async function generateQrBuffer(
  text: string,
  options: QrOptions = {},
): Promise<Buffer> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  return QRCode.toBuffer(text, mergedOptions);
}

/**
 * Construct the canonical customer feedback URL for a specific acquisition channel
 */
export function buildSourceUrl(
  baseUrl: string,
  slug: string,
  source: 'reception' | 'instagram',
): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/r/${encodeURIComponent(slug)}?source=${source}`;
}
