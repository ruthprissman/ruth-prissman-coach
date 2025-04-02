
import React from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface StoryDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

export const StoryDescriptionModal: React.FC<StoryDescriptionModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md md:max-w-lg bg-white/95 backdrop-blur-sm border border-gold/20 p-6 rounded-lg shadow-lg">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-5 w-5 text-[#4A235A]" />
          <span className="sr-only">סגור</span>
        </DialogClose>
        
        <div className="mt-2">
          <h2 className="text-2xl font-alef font-bold text-[#4A235A] mb-4 text-right">
            {title}
          </h2>
          <div className="text-gray-700 text-right whitespace-pre-line">
            {description}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
