
export interface Testimonial {
  id: number;
  name?: string;
  summary?: string;
  text_full?: string;
  image_url?: string;
  source_type?: 'whatsapp' | 'email' | 'phone';
}
