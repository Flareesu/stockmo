/**
 * StockMo Pre-signed URL Generator
 *
 * Lambda Function URL endpoint that generates pre-signed S3 upload URLs.
 * The frontend calls this to get a temporary URL for direct-to-S3 uploads
 * without exposing AWS credentials.
 *
 * Request:  POST { fileName: "fleet.xlsx", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
 * Response: { uploadUrl: "https://...", key: "uploads/2026-04-16/abc123-fleet.xlsx" }
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const s3     = new S3Client();
const BUCKET = process.env.S3_BUCKET;

const ALLOWED_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel',                                          // .xls
  'text/csv',                                                          // .csv
  'application/csv',
]);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function handler(event) {
  // Handle CORS preflight
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { fileName, contentType } = body;

    if (!fileName) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'fileName is required' }),
      };
    }

    // Validate file type
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Only .xlsx, .xls, and .csv files are accepted' }),
      };
    }

    // Build a unique S3 key: uploads/YYYY-MM-DD/uuid-filename.xlsx
    const today = new Date().toISOString().split('T')[0];
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `uploads/${today}/${randomUUID()}-${safeFileName}`;

    // Determine content type
    const resolvedType = ALLOWED_TYPES.has(contentType)
      ? contentType
      : ext === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    // Generate pre-signed PUT URL (expires in 10 minutes)
    const command = new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      ContentType: resolvedType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 });

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadUrl, key }),
    };

  } catch (err) {
    console.error('Pre-sign error:', err);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to generate upload URL' }),
    };
  }
}
