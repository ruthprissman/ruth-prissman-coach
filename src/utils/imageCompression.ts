/**
 * דחיסת תמונות בצד הלקוח לפני העלאה ל-Storage.
 *
 * מקטין תמונות גדולות (מימדים + איכות) כדי לחסוך נפח אחסון ותעבורה (egress).
 * בטוח לעטוף בו כל קריאת upload: קבצים שאינם תמונה (PDF, GIF, SVG) או תמונות
 * קטנות ממילא — מוחזרים ללא שינוי. בכל שגיאה מוחזר הקובץ המקורי (fail-safe).
 */

export interface CompressOptions {
  /** מימד מקסימלי (רוחב או גובה) בפיקסלים. ברירת מחדל 1600. */
  maxDimension?: number;
  /** איכות JPEG/WebP בין 0 ל-1. ברירת מחדל 0.82. */
  quality?: number;
  /** קבצים מתחת לגודל הזה (bytes) שאינם דורשים הקטנת מימד — לא נדחסים. ברירת מחדל 400KB. */
  skipUnderBytes?: number;
}

const SKIP_TYPES = new Set(['image/gif', 'image/svg+xml', 'image/x-icon']);

export async function compressImage<T extends File | Blob>(file: T, options: CompressOptions = {}): Promise<T> {
  try {
    if (!file || !file.type || !file.type.startsWith('image/')) return file;
    if (SKIP_TYPES.has(file.type)) return file;
    // סביבה ללא DOM (SSR/טסטים) — לא נוגעים
    if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') return file;

    const maxDimension = options.maxDimension ?? 1600;
    const quality = options.quality ?? 0.82;
    const skipUnderBytes = options.skipUnderBytes ?? 400 * 1024;

    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxDimension / Math.max(width, height));

    // תמונה קטנה שלא צריך להקטין את מימדיה — משאירים כמו שהיא
    if (scale === 1 && file.size < skipUnderBytes) {
      bitmap.close?.();
      return file;
    }

    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close?.();

    // שומרים על אותו פורמט (וכך על אותה סיומת/שם) כדי לא לשבור נתיבים/URLs.
    // PNG נשאר PNG (שומר שקיפות); JPEG/WebP נדחסים באיכות.
    const outputType =
      file.type === 'image/png' ? 'image/png'
      : file.type === 'image/webp' ? 'image/webp'
      : 'image/jpeg';

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(
        (b) => resolve(b),
        outputType,
        outputType === 'image/png' ? undefined : quality,
      ),
    );

    // אם לא הצלחנו לדחוס או שהתוצאה לא קטנה יותר — מחזירים מקור
    if (!blob || blob.size >= file.size) return file;

    const name = (file as File).name ?? 'image';
    return new File([blob], name, { type: file.type, lastModified: Date.now() }) as unknown as T;
  } catch {
    return file;
  }
}
