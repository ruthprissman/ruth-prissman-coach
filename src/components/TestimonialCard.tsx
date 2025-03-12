
import React from 'react';
import { Testimonial } from '@/types/testimonial';
import { MessageSquare, Mail, Phone } from 'lucide-react';

interface TestimonialCardProps {
  testimonial: Testimonial;
  onClick: () => void;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({ 
  testimonial, 
  onClick 
}) => {
  const getSourceIcon = () => {
    switch (testimonial.source_type) {
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-[#25D366]" />;
      case 'email':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="backdrop-blur-sm p-5 rounded-lg shadow-gold-sm transition-colors duration-300 hover:bg-white/20 cursor-pointer"
      onClick={onClick}
    >
      {testimonial.image_url ? (
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full overflow-hidden mb-3">
            <img 
              src={testimonial.image_url} 
              alt={testimonial.name || 'ממליץ'} 
              className="w-full h-full object-cover"
            />
          </div>
          {testimonial.name && (
            <p className="text-[#4A235A] font-semibold text-center mb-1">
              {testimonial.name}
            </p>
          )}
          <div className="flex justify-center mb-2">
            {getSourceIcon()}
          </div>
          {testimonial.summary && (
            <p className="text-[#4A235A] text-center text-sm">
              "{testimonial.summary}"
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="flex justify-center mb-4">
            {[...Array(5)].map((_, i) => (
              <svg 
                key={i} 
                className="w-5 h-5 text-gold" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            ))}
          </div>
          <p className="text-[#4A235A] mb-4 text-center">
            "{testimonial.summary}"
          </p>
          {testimonial.name && (
            <div className="flex items-center justify-center gap-2">
              <p className="text-[#4A235A] font-semibold text-center">
                {testimonial.name}
              </p>
              {getSourceIcon()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
