
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabaseClient } from '@/lib/supabaseClient';

interface UploadSignatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (url: string) => void;
}

const UploadSignatureDialog: React.FC<UploadSignatureDialogProps> = ({
  isOpen,
  onClose,
  onUploadComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check if it's an image
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: "קובץ לא תקין",
          description: "אנא בחר קובץ תמונה (PNG, JPG, JPEG)",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
      setUploadedUrl(''); // Reset previous upload
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);

    try {
      const supabase = supabaseClient();
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `ruth-signature.${fileExt}`;
      
      // Upload to site_imgs bucket
      const { data, error } = await supabase.storage
        .from('site_imgs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // This will replace the existing file if it exists
        });

      if (error) {
        throw error;
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('site_imgs')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;
      setUploadedUrl(publicUrl);

      toast({
        title: "התמונה הועלתה בהצלחה",
        description: "החתימה שלך מוכנה לשימוש במיילים"
      });

      onUploadComplete(publicUrl);

    } catch (error: any) {
      console.error('Error uploading signature:', error);
      toast({
        title: "שגיאה בהעלאת התמונה",
        description: error.message || "אירעה שגיאה בהעלאת התמונה",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setUploadedUrl('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">העלאת חתימה</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="signature-file" className="text-right block mb-2">
              בחר תמונת חתימה
            </Label>
            <Input
              id="signature-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-right"
            />
          </div>

          {file && (
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-right">
                <strong>קובץ נבחר:</strong> {file.name}
              </p>
              <p className="text-sm text-gray-600 text-right">
                גודל: {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          {uploadedUrl && (
            <div className="p-4 bg-green-50 rounded-md border border-green-200">
              <div className="flex items-center justify-end gap-2 mb-2">
                <span className="text-green-600 text-sm font-medium">התמונה הועלתה בהצלחה</span>
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-center">
                <img 
                  src={uploadedUrl} 
                  alt="חתימה" 
                  className="max-w-full h-auto max-h-32 mx-auto rounded border"
                />
              </div>
              <p className="text-xs text-gray-600 text-right mt-2 break-all">
                {uploadedUrl}
              </p>
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800 text-right">
                התמונה תועלה למיקום ציבורי באתר שלך ותהיה זמינה לשימוש במיילים.
                מומלץ להשתמש בתמונה בגודל סביר (עד 1MB).
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleClose}>
              ביטול
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="bg-[#4A235A] hover:bg-[#5d2a6e] text-white"
            >
              {isUploading ? (
                "מעלה..."
              ) : (
                <>
                  <Upload className="ml-2 h-4 w-4" />
                  העלה חתימה
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadSignatureDialog;
