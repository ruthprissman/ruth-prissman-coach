
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
      <DialogContent className="p-0 rounded-lg shadow-lg bg-white/95 backdrop-blur-sm border border-gold/20 max-w-[450px] w-[95vw] mx-auto overflow-hidden">
        {/* Custom close button with dark background for better visibility */}
        <DialogClose className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1.5 opacity-80 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-5 w-5 text-white" />
          <span className="sr-only">סגור</span>
        </DialogClose>
        
        {/* Flexible container that adapts to content */}
        <div className="flex flex-col">
          {/* Story image - maintain square aspect ratio */}
          <div className="w-full aspect-square overflow-hidden">
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
          
          {/* Content container - dynamically sizes based on content */}
          <div className="p-4 flex flex-col">
            {/* Title */}
            <h2 className="text-xl font-alef font-bold text-[#4A235A] mb-3 text-right">
              {title}
            </h2>
            
            {/* Description text - no fixed height, just natural flow with padding */}
            <div className="text-gray-700 text-right text-justify whitespace-pre-line mb-6">
              {description}
            </div>
            
            {/* Download button - always at the bottom with consistent spacing */}
            <div className="flex justify-start mt-2">
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
