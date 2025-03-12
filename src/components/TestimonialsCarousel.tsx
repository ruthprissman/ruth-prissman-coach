
import React, { useState, useEffect } from 'react';
import { Testimonial } from '@/types/testimonial';
import { TestimonialCard } from '@/components/TestimonialCard';
import { TestimonialModal } from '@/components/TestimonialModal';
import { fetchTestimonials } from '@/services/TestimonialService';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const TestimonialsCarousel: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const testimonialsPerPage = 3;

  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        setLoading(true);
        const data = await fetchTestimonials();
        setTestimonials(data);
      } catch (error) {
        console.error('Error loading testimonials:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTestimonials();
  }, []);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex > 0 ? prevIndex - 1 : Math.max(0, testimonials.length - testimonialsPerPage)
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex + testimonialsPerPage < testimonials.length ? prevIndex + 1 : 0
    );
  };

  const handleTestimonialClick = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Don't render anything if there are no testimonials
  if (!loading && testimonials.length === 0) {
    return null;
  }

  const visibleTestimonials = testimonials.slice(
    currentIndex,
    Math.min(currentIndex + testimonialsPerPage, testimonials.length)
  );

  return (
    <section className="py-16 px-4 relative">
      <div className="absolute inset-0 bg-gold/5"></div>
      <div className="container mx-auto relative z-10">
        <div className="text-right mb-12 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#4A235A] mb-4 gold-text-shadow">
            מה אומרים אחרי פגישות
          </h2>
          <p className="text-purple-light max-w-2xl mr-0 ml-auto">
            התגובות של אנשים שעברו תהליך משמעותי בעזרת שיטת "קוד הנפש"
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-4 mb-8">
              <Button 
                variant="outline" 
                size="icon" 
                className="bg-white/80 hover:bg-white border border-gold/30"
                onClick={handlePrevious}
                disabled={testimonials.length <= testimonialsPerPage}
              >
                <ChevronRight className="h-5 w-5 text-[#4A235A]" />
              </Button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {visibleTestimonials.map((testimonial) => (
                  <TestimonialCard
                    key={testimonial.id}
                    testimonial={testimonial}
                    onClick={() => handleTestimonialClick(testimonial)}
                  />
                ))}
              </div>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="bg-white/80 hover:bg-white border border-gold/30"
                onClick={handleNext}
                disabled={testimonials.length <= testimonialsPerPage}
              >
                <ChevronLeft className="h-5 w-5 text-[#4A235A]" />
              </Button>
            </div>
          </>
        )}
      </div>
      
      <TestimonialModal
        testimonial={selectedTestimonial}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </section>
  );
};
