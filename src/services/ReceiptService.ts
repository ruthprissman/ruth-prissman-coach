
import { supabaseClient } from '@/lib/supabaseClient';

export type UploadResult = {
  path: string;
};

const BUCKET = 'receipts';

function sanitizeFileName(name: string) {
  return name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
}

export async function uploadReceiptForTransaction(
  transactionId: number,
  file: File,
  previousPath?: string | null
): Promise<UploadResult> {
  if (!file) {
    throw new Error('No file selected');
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('סוג קובץ לא נתמך. ניתן להעלות PDF, JPG או PNG');
  }
  if (file.size > maxSize) {
    throw new Error('הקובץ גדול מדי (מקסימום 10MB)');
  }

  const client = supabaseClient();

  // Build a unique path
  const timestamp = Date.now();
  const fileName = sanitizeFileName(file.name);
  const path = `transactions/${transactionId}/${timestamp}-${fileName}`;

  // Upload to storage
  const { error: uploadError } = await client.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) {
    console.error('[ReceiptService] Upload error:', uploadError);
    throw new Error(uploadError.message || 'שגיאה בהעלאת הקובץ');
  }

  // Optionally delete previous file (best-effort)
  if (previousPath) {
    await client.storage.from(BUCKET).remove([previousPath]).catch((e) => {
      console.warn('[ReceiptService] Failed to remove old receipt:', e);
    });
  }

  // Update transaction with new path
  const { error: updateError } = await client
    .from('transactions')
    .update({ attachment_url: path })
    .eq('id', transactionId);

  if (updateError) {
    console.error('[ReceiptService] Failed to update transaction:', updateError);
    // Rollback uploaded file if DB update failed (best-effort)
    await client.storage.from(BUCKET).remove([path]).catch(() => {});
    throw new Error(updateError.message || 'שגיאה בעדכון פרטי הקבלה');
  }

  return { path };
}

export async function getReceiptSignedUrl(path: string, expiresInSeconds = 60 * 5): Promise<string> {
  if (!path) throw new Error('Path is empty');

  const client = supabaseClient();
  const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    console.error('[ReceiptService] Failed to create signed URL:', error);
    throw new Error(error?.message || 'שגיאה בפתיחת הקבלה');
  }
  return data.signedUrl;
}

export async function deleteReceiptForTransaction(transactionId: number, path: string) {
  const client = supabaseClient();

  // Remove file
  const { error: removeErr } = await client.storage.from(BUCKET).remove([path]);
  if (removeErr) {
    console.error('[ReceiptService] Failed to remove receipt:', removeErr);
    throw new Error(removeErr.message || 'שגיאה במחיקת הקובץ');
  }

  // Clear path on transaction
  const { error: updateErr } = await client.from('transactions').update({ attachment_url: null }).eq('id', transactionId);
  if (updateErr) {
    console.error('[ReceiptService] Failed to clear receipt_path on transaction:', updateErr);
    throw new Error(updateErr.message || 'שגיאה בעדכון הרשומה');
  }
}
