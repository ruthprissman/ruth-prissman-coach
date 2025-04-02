
import React from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { X, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StoryDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  imageUrl: string;
  pdfUrl: string;
}

export const StoryDescriptionModal: React.FC<StoryDescriptionModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  imageUrl,
  pdfUrl,
}) => {
  // Helper function to get story image or use default
  const getStoryImage = (imageUrl: string) => {
    return imageUrl && imageUrl.trim() !== ""
      ? imageUrl
      : "https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/sign/stories_img/default.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJzdG9yaWVzX2ltZy9kZWZhdWx0LmpwZyIsImlhdCI6MTc0MTA5OTE1MCwiZXhwIjoyMzcxODE5MTUwfQ.k3rGaTGlhjgrqxFxiJT9H70Aaq89RbM_kDKuTxqTgcQ";
  };

  const handleDownloadPDF = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md md:max-w-lg bg-white/95 backdrop-blur-sm border border-gold/20 p-0 rounded-lg shadow-lg">
        <DialogClose className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-5 w-5 text-[#4A235A]" />
          <span className="sr-only">סגור</span>
        </DialogClose>
        
        <div className="w-full">
          {/* Story image */}
          <div className="w-full h-48 md:h-64 overflow-hidden rounded-t-lg">
            <img 
              src={getStoryImage(imageUrl)} 
              alt={title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
          </div>
          
          {/* Content container */}
          <div className="p-6">
            {/* Title */}
            <h2 className="text-2xl font-alef font-bold text-[#4A235A] mb-4 text-right">
              {title}
            </h2>
            
            {/* Description text */}
            <div className="text-gray-700 text-right whitespace-pre-line overflow-y-auto max-h-[40vh] mb-6">
              {description}
            </div>
            
            {/* Download button */}
            <div className="flex justify-start">
              <Button
                variant="outline"
                className="text-[#4A235A] border-[#4A235A] hover:bg-[#4A235A] hover:text-white"
                onClick={() => handleDownloadPDF(pdfUrl)}
              >
                <FileDown size={18} className="ml-2" />
                הורד PDF
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
