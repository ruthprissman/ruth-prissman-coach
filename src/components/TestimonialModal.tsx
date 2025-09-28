
import React from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Testimonial } from '@/types/testimonial';

interface TestimonialModalProps {
  testimonial: Testimonial | null;
  onClose: () => void;
}

export const TestimonialModal: React.FC<TestimonialModalProps> = ({
  testimonial,
  onClose
}) => {
  if (!testimonial) return null;

  return (
    <Dialog open={!!testimonial} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl p-0">
        <div className="relative">
          <DialogClose className="absolute top-4 left-4 z-50 p-2 rounded-full bg-white/80 hover:bg-white transition-colors">
            <X className="h-4 w-4" />
          </DialogClose>
          
          {testimonial.image_url ? (
            /* Image testimonial */
            <div className="p-8 text-center">
              <img 
                src={testimonial.image_url} 
                alt={`המלצה מ${testimonial.name || 'אנונימי'}`}
                className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
              />
              <div className="mt-6 space-y-3">
                <h3 className="text-2xl font-alef font-bold text-foreground">
                  {testimonial.name || 'אנונימי'}
                </h3>
                {testimonial.summary && (
                  <p className="text-lg font-heebo text-muted-foreground leading-relaxed">
                    "{testimonial.summary}"
                  </p>
                )}
                {testimonial.source_type && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <span>
                      {testimonial.source_type === 'whatsapp' ? 'WhatsApp' : 
                       testimonial.source_type === 'email' ? 'אימייל' : 'טלפון'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Text testimonial */
            <div className="p-8" dir="rtl">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center border-b pb-6 mb-8">
                  <h3 className="text-3xl font-alef font-bold text-foreground mb-3">
                    {testimonial.name || 'אנונימי'}
                  </h3>
                  {testimonial.source_type && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>
                        {testimonial.source_type === 'whatsapp' ? 'WhatsApp' : 
                         testimonial.source_type === 'email' ? 'אימייל' : 'טלפון'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <div className="absolute top-0 right-0 text-6xl text-primary/20 font-serif leading-none">
                    "
                  </div>
                  <div className="pr-12">
                    {testimonial.text_full ? (
                      <div className="text-lg font-heebo text-foreground leading-relaxed whitespace-pre-line">
                        {testimonial.text_full}
                      </div>
                    ) : (
                      <div className="text-xl font-heebo text-foreground leading-relaxed">
                        {testimonial.summary}
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 text-6xl text-primary/20 font-serif leading-none transform rotate-180">
                    "
                  </div>
                </div>
                
                <div className="text-center pt-6 border-t">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-muted/50 rounded-full">
                    <div className="w-3 h-3 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                    <span className="font-heebo text-muted-foreground text-sm">
                      המלצה אמיתית מלקוחה
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
