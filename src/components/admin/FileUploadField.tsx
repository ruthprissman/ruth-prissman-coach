
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface FileUploadFieldProps {
  onFileSelected: (file: File | undefined) => void;
  id?: string;
  name?: string;
  acceptedTypes?: string;
  compressPDF?: boolean;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  onFileSelected,
  id,
  name,
  acceptedTypes = ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png",
  compressPDF = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressPDFFile = async (file: File): Promise<File> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Compress by reducing image quality and removing unused objects
    const pdfBytes = await pdfDoc.save({
      useObjectStreams: false,
      objectsPerTick: 50,
    });
    
    return new File([pdfBytes as BlobPart], file.name, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (!file) {
      setSelectedFile(null);
      onFileSelected(undefined);
      return;
    }

    let processedFile = file;

    // Compress PDF if needed and file is PDF
    if (compressPDF && file.type === 'application/pdf') {
      setIsCompressing(true);
      try {
        processedFile = await compressPDFFile(file);
        console.log(`PDF compressed: ${file.size} → ${processedFile.size} bytes`);
      } catch (error) {
        console.error('PDF compression failed:', error);
        // Use original file if compression fails
        processedFile = file;
      } finally {
        setIsCompressing(false);
      }
    }

    setSelectedFile(processedFile);
    onFileSelected(processedFile);
  };

  const clearFile = () => {
    setSelectedFile(null);
    onFileSelected(undefined);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleButtonClick}
          className="flex-1"
          disabled={isCompressing}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isCompressing ? 'דוחס PDF...' : 'בחר קובץ'}
        </Button>
        <Input
          type="file"
          id={id}
          name={name}
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept={acceptedTypes}
        />
      </div>
      
      {selectedFile && (
        <div className="flex items-center justify-between p-2 bg-muted rounded">
          <div className="flex-1 min-w-0">
            <span className="text-sm truncate block">{selectedFile.name}</span>
            <span className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFile}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUploadField;
