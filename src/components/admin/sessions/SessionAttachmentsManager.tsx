import React, { useState, useCallback } from 'react';
import { Upload, X, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabaseClient } from '@/lib/supabaseClient';

interface SessionAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

interface SessionAttachmentsManagerProps {
  attachmentUrls: string[];
  onAttachmentsChange: (urls: string[]) => void;
  maxFiles?: number;
}

const SessionAttachmentsManager: React.FC<SessionAttachmentsManagerProps> = ({
  attachmentUrls,
  onAttachmentsChange,
  maxFiles = 5,
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<SessionAttachment[]>([]);

  // Parse existing attachment URLs into attachment objects
  React.useEffect(() => {
    const parseAttachments = async () => {
      const parsedAttachments: SessionAttachment[] = [];
      
      for (const url of attachmentUrls) {
        if (url) {
          // Extract filename from URL
          const urlParts = url.split('/');
          const filename = urlParts[urlParts.length - 1];
          const extension = filename.split('.').pop()?.toLowerCase() || '';
          
          parsedAttachments.push({
            id: filename,
            name: filename,
            url: url,
            type: getFileType(extension),
            size: 0, // We don't have size info from URL
          });
        }
      }
      
      setAttachments(parsedAttachments);
    };

    parseAttachments();
  }, [attachmentUrls]);

  const getFileType = (extension: string): string => {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const docTypes = ['pdf', 'doc', 'docx'];
    
    if (imageTypes.includes(extension)) return 'image';
    if (docTypes.includes(extension)) return 'document';
    return 'other';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Function to compress images to under 500KB
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Start with original dimensions
        let { width, height } = img;
        
        // Reduce dimensions if file is too large
        const maxDimension = 1200;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          // Try different quality levels to get under 500KB
          const tryCompress = (quality: number) => {
            canvas.toBlob((blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                
                // If still too large and quality can be reduced further, try again
                if (blob.size > 500 * 1024 && quality > 0.1) {
                  tryCompress(quality - 0.1);
                } else {
                  resolve(compressedFile);
                }
              } else {
                resolve(file); // Fallback to original if compression fails
              }
            }, 'image/jpeg', quality);
          };
          
          // Start with 80% quality
          tryCompress(0.8);
        } else {
          resolve(file);
        }
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > maxFiles) {
      toast({
        title: "שגיאה",
        description: `ניתן להעלות עד ${maxFiles} קבצים לפגישה`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const newUrls: string[] = [];

      for (const file of Array.from(files)) {
        // Validate file type
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'];
        
        if (!allowedTypes.includes(extension)) {
          toast({
            title: "סוג קובץ לא נתמך",
            description: `הקובץ ${file.name} אינו נתמך. ניתן להעלות רק תמונות וקבצי PDF/Word`,
            variant: "destructive",
          });
          continue;
        }

        let processedFile = file;

        // Compress images if they're over 500KB
        const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (imageTypes.includes(extension) && file.size > 500 * 1024) {
          console.log(`דחיסת תמונה: ${file.name} (${Math.round(file.size / 1024)}KB)`);
          processedFile = await compressImage(file);
          console.log(`תמונה נדחסה: ${processedFile.name} (${Math.round(processedFile.size / 1024)}KB)`);
          
          toast({
            title: "תמונה נדחסה",
            description: `${file.name} נדחסה מ-${Math.round(file.size / 1024)}KB ל-${Math.round(processedFile.size / 1024)}KB`,
          });
        } else if (!imageTypes.includes(extension) && file.size > 10 * 1024 * 1024) {
          // For non-image files, keep the 10MB limit
          toast({
            title: "קובץ גדול מדי",
            description: `הקובץ ${file.name} גדול מדי. הגודל המקסימלי לקבצי PDF/Word הוא 10MB`,
            variant: "destructive",
          });
          continue;
        }

        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `${timestamp}_${processedFile.name}`;

        // Upload file to Supabase Storage
        const { data, error } = await supabaseClient()
          .storage
          .from('session-attachments')
          .upload(fileName, processedFile);

        if (error) {
          console.error('Upload error:', error);
          toast({
            title: "שגיאה בהעלאת קובץ",
            description: `נכשל בהעלאת ${processedFile.name}: ${error.message}`,
            variant: "destructive",
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabaseClient()
          .storage
          .from('session-attachments')
          .getPublicUrl(fileName);

        newUrls.push(urlData.publicUrl);
      }

      if (newUrls.length > 0) {
        const updatedUrls = [...attachmentUrls, ...newUrls];
        onAttachmentsChange(updatedUrls);
        
        toast({
          title: "קבצים הועלו בהצלחה",
          description: `הועלו ${newUrls.length} קבצים`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "שגיאה בהעלאת קבצים",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  }, [attachments.length, maxFiles, attachmentUrls, onAttachmentsChange, toast]);

  const handleDeleteAttachment = async (attachmentToDelete: SessionAttachment) => {
    try {
      // Extract filename from URL
      const urlParts = attachmentToDelete.url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Delete from Supabase Storage
      const { error } = await supabaseClient()
        .storage
        .from('session-attachments')
        .remove([fileName]);

      if (error) {
        console.error('Delete error:', error);
        toast({
          title: "שגיאה במחיקת קובץ",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Update the URLs list
      const updatedUrls = attachmentUrls.filter(url => url !== attachmentToDelete.url);
      onAttachmentsChange(updatedUrls);

      toast({
        title: "קובץ נמחק בהצלחה",
        description: attachmentToDelete.name,
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "שגיאה במחיקת קובץ",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAttachment = (attachment: SessionAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="space-y-2">
        <Label className="text-purple-700">קבצים מצורפים (עד {maxFiles} קבצים)</Label>
        <p className="text-sm text-muted-foreground">
          תמונות יידחסו אוטומטית ל-500KB, קבצי PDF/Word עד 10MB
        </p>
        
        {/* Upload Button */}
        <div className="flex items-center gap-2">
          <Input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
            onChange={handleFileUpload}
            disabled={isUploading || attachments.length >= maxFiles}
            className="hidden"
            id="file-upload"
          />
          <Label
            htmlFor="file-upload"
            className={`
              flex items-center gap-2 px-4 py-2 border border-purple-200 rounded-md cursor-pointer
              hover:bg-purple-50 transition-colors
              ${(isUploading || attachments.length >= maxFiles) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'מעלה קבצים...' : 'העלה קבצים'}
          </Label>
          <span className="text-sm text-muted-foreground">
            ({attachments.length}/{maxFiles})
          </span>
        </div>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <Label className="text-purple-700">קבצים מצורפים:</Label>
          <div className="grid gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border border-purple-200 rounded-md bg-purple-50"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(attachment.type)}
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {attachment.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadAttachment(attachment)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAttachment(attachment)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionAttachmentsManager;
