import { supabase } from './supabase';

// ─── Supabase Storage Helpers ──────────────────────────────────────────────────

const BUCKET = 'vehicle-photos';

export type PhotoContext = 'vehicle' | 'pdi' | 'stockyard' | 'final';

/**
 * Upload a vehicle cover photo.
 * Returns the storage path and a signed URL valid for 1 hour.
 */
export async function uploadVehicleCover(
  vehicleId: string,
  file: File,
): Promise<{ path: string; url: string }> {
  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${vehicleId}/cover.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw new Error(`Cover upload failed: ${error.message}`);

  // Cover photos are displayed persistently — use a 10-year signed URL (315,360,000 s)
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 315_360_000);
  return { path, url: data?.signedUrl ?? '' };
}

/**
 * Upload a photo attached to a specific check item (issue photo).
 * Returns the storage path and a signed URL valid for 1 hour.
 */
export async function uploadIssuePhoto(
  vehicleId: string,
  checkItemId: string,
  file: File,
): Promise<{ path: string; url: string }> {
  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const uuid = crypto.randomUUID();
  const path = `${vehicleId}/issues/${checkItemId}/${uuid}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
  });
  if (error) throw new Error(`Issue photo upload failed: ${error.message}`);

  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return { path, url: data?.signedUrl ?? '' };
}

/**
 * Insert a photo record into the photos table after upload.
 */
export async function savePhotoRecord(params: {
  vehicleId:   string;
  context:     PhotoContext;
  checkItemId?: string;
  storagePath: string;
  url:         string;
  caption?:    string;
}): Promise<void> {
  const { error } = await supabase.from('photos').insert({
    vehicle_id:    params.vehicleId,
    context:       params.context,
    check_item_id: params.checkItemId ?? null,
    storage_path:  params.storagePath,
    url:           params.url,
    caption:       params.caption ?? null,
  });
  if (error) throw new Error(`Photo record save failed: ${error.message}`);
}

/**
 * Fetch all photos for a vehicle, optionally filtered by context.
 */
export async function getVehiclePhotos(
  vehicleId: string,
  context?: PhotoContext,
) {
  let q = supabase
    .from('photos')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  if (context) q = q.eq('context', context);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

/**
 * Get a fresh signed URL for a stored photo (URLs expire after 1 hour).
 */
export async function getSignedUrl(storagePath: string): Promise<string> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? '';
}
