import { describe, it, expect } from 'vitest';
import {
  generateQrDataUrl,
  generateQrSvg,
  generateQrBuffer,
  buildSourceUrl,
} from '../qr.service.js';

describe('QR Code Generation & Source Tracking Service', () => {
  const testUrl = 'http://localhost:5173/r/demo-cafe?source=reception';

  it('should generate valid PNG base64 Data URLs', async () => {
    const dataUrl = await generateQrDataUrl(testUrl);

    expect(dataUrl).toBeTypeOf('string');
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(dataUrl.length).toBeGreaterThan(100);
  });

  it('should generate valid vector SVG markup', async () => {
    const svg = await generateQrSvg(testUrl);

    expect(svg).toBeTypeOf('string');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('viewBox');
    expect(svg).toContain('path');
  });

  it('should generate high-resolution PNG binary buffers with valid PNG magic headers', async () => {
    const buffer = await generateQrBuffer(testUrl, {
      width: 1024,
      errorCorrectionLevel: 'H',
    });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(500);

    // PNG Magic Bytes: 0x89 0x50 0x4E 0x47 (‰PNG)
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
    expect(buffer[2]).toBe(0x4e);
    expect(buffer[3]).toBe(0x47);
  });

  it('should construct canonical feedback URLs with source attribution', () => {
    const reception = buildSourceUrl('https://app.reputationos.com', 'blue-bottle-coffee', 'reception');
    expect(reception).toBe('https://app.reputationos.com/r/blue-bottle-coffee?source=reception');

    const instagram = buildSourceUrl('https://app.reputationos.com/', 'blue-bottle-coffee', 'instagram');
    expect(instagram).toBe('https://app.reputationos.com/r/blue-bottle-coffee?source=instagram');
  });

  it('should handle trailing slashes cleanly in URL construction', () => {
    const url1 = buildSourceUrl('https://example.com///', 'my-business', 'reception');
    const url2 = buildSourceUrl('https://example.com', 'my-business', 'reception');

    expect(url1).toBe(url2);
    expect(url1).toBe('https://example.com/r/my-business?source=reception');
  });
});
