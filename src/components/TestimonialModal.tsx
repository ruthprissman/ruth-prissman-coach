
import React from 'react';
import { Testimonial } from '@/types/testimonial';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TestimonialModalProps {
  testimonial: Testimonial | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TestimonialModal: React.FC<TestimonialModalProps> = ({
  testimonial,
  isOpen,
  onClose
}) => {
  if (!testimonial) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl text-[#4A235A]">
            {testimonial.name 
              ? `המלצה מאת ${testimonial.name}` 
              : 'המלצה'}
          </DialogTitle>
        </DialogHeader>
        
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">סגור</span>
        </DialogClose>
        
        <div className="py-4 text-right">
          {testimonial.image_url ? (
            <div className="flex justify-center mb-4">
              <img 
                src={testimonial.image_url} 
                alt={`תמונה מאת ${testimonial.name || 'ממליץ'}`}
                className="max-w-full h-auto rounded-md"
              />
            </div>
          ) : testimonial.text_full ? (
            <p className="text-[#4A235A] text-right leading-relaxed">
              {testimonial.text_full}
            </p>
          ) : (
            <p className="text-[#4A235A] text-right">
              {testimonial.summary}
            </p>
          )}
        </div>
        
        <div className="flex justify-center mt-2">
          <Button 
            onClick={onClose}
            className="bg-gold hover:bg-gold-dark text-white"
          >
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
