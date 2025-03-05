
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X } from 'lucide-react';

interface FileUploadFieldProps {
  onFileSelected: (file: File | undefined) => void;
  id?: string;
  name?: string;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  onFileSelected,
  id,
  name,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    onFileSelected(file || undefined);
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
        >
          <Upload className="mr-2 h-4 w-4" />
          בחר קובץ
        </Button>
        <Input
          type="file"
          id={id}
          name={name}
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        />
      </div>
      
      {selectedFile && (
        <div className="flex items-center justify-between p-2 bg-muted rounded">
          <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFile}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUploadField;
