import { Router } from 'express';
import { requireAuth, requireBusiness, type BusinessRequest } from '../middleware/auth.js';
import { generateQrDataUrl, generateQrSvg, generateQrBuffer, buildSourceUrl } from '../services/qr.service.js';
import { env } from '../lib/env.js';

const router = Router();

// Helper to determine application base URL
function getAppBaseUrl(req: any): string {
  // Prefer CORS_ORIGIN or request origin / host for accurate link generation
  if (env.CORS_ORIGIN && !env.CORS_ORIGIN.includes('*')) {
    return env.CORS_ORIGIN.replace(/\/+$/, '');
  }
  const protocol = req.protocol || 'http';
  const host = req.get('host') || `localhost:${env.PORT}`;
  return `${protocol}://${host}`;
}

// ── GET /api/v1/sources ─────────────────────────────────────
// Returns the two acquisition sources (Reception QR + Instagram) with preview and download links
router.get('/', requireAuth, requireBusiness, async (req, res) => {
  try {
    const bizReq = req as BusinessRequest;
    const { slug, name } = bizReq.business;

    const baseUrl = getAppBaseUrl(req);
    const receptionUrl = buildSourceUrl(baseUrl, slug, 'reception');
    const instagramUrl = buildSourceUrl(baseUrl, slug, 'instagram');

    // Generate in-process preview QR for reception
    const qrPreviewDataUrl = await generateQrDataUrl(receptionUrl, {
      width: 400,
      margin: 2,
    });

    res.status(200).json({
      reception: {
        sourceType: 'reception',
        label: 'Reception Counter QR',
        url: receptionUrl,
        qrPreviewDataUrl,
        downloadPngUrl: '/api/v1/sources/reception/qr.png',
        downloadSvgUrl: '/api/v1/sources/reception/qr.svg',
      },
      instagram: {
        sourceType: 'instagram',
        label: 'Instagram Bio Link',
        url: instagramUrl,
      },
      business: {
        name,
        slug,
      },
    });
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/v1/sources/reception/qr.png ─────────────────────
// Direct download of high-resolution print-ready PNG (1024x1024)
router.get('/reception/qr.png', requireAuth, requireBusiness, async (req, res) => {
  try {
    const bizReq = req as BusinessRequest;
    const { slug } = bizReq.business;

    const baseUrl = getAppBaseUrl(req);
    const receptionUrl = buildSourceUrl(baseUrl, slug, 'reception');

    const pngBuffer = await generateQrBuffer(receptionUrl, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: 'H', // High error correction for physical print durability
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${slug}-reception-qr.png"`);
    res.send(pngBuffer);
  } catch (error) {
    console.error('Error generating QR PNG download:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// ── GET /api/v1/sources/reception/qr.svg ─────────────────────
// Direct download of vector SVG QR code for professional print collateral
router.get('/reception/qr.svg', requireAuth, requireBusiness, async (req, res) => {
  try {
    const bizReq = req as BusinessRequest;
    const { slug } = bizReq.business;

    const baseUrl = getAppBaseUrl(req);
    const receptionUrl = buildSourceUrl(baseUrl, slug, 'reception');

    const svgString = await generateQrSvg(receptionUrl, {
      margin: 2,
      errorCorrectionLevel: 'H',
    });

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${slug}-reception-qr.svg"`);
    res.send(svgString);
  } catch (error) {
    console.error('Error generating QR SVG download:', error);
    res.status(500).json({ error: 'Failed to generate vector QR' });
  }
});

export default router;
