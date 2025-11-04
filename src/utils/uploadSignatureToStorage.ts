import { supabaseClient } from '@/lib/supabaseClient';

/**
 * Uploads the signature image to Supabase Storage if it doesn't exist yet
 */
export const uploadSignatureToStorage = async (): Promise<string> => {
  const supabase = supabaseClient();
  const fileName = 'email-signature.png';
  
  try {
    // Check if file already exists
    const { data: existingFile } = await supabase.storage
      .from('site_imgs')
      .list('', { search: fileName });
    
    if (existingFile && existingFile.length > 0) {
      // File exists, return public URL
      const { data: publicUrlData } = supabase.storage
        .from('site_imgs')
        .getPublicUrl(fileName);
      return publicUrlData.publicUrl;
    }
    
    // Fetch the image from public folder
    const response = await fetch('/assets/email-signature.png');
    const blob = await response.blob();
    
    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('site_imgs')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading signature:', error);
      throw error;
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('site_imgs')
      .getPublicUrl(fileName);
    
    console.log('Signature uploaded successfully:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Failed to upload signature:', error);
    // Fallback to direct URL
    return 'https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_imgs/email-signature.png';
  }
};

/**
 * Gets the public URL of the signature image
 */
export const getSignatureUrl = (): string => {
  return 'https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_imgs/email-signature.png';
};
