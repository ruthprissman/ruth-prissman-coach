
import { supabase } from '@/lib/supabase';
import { Testimonial } from '@/types/testimonial';

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching testimonials:', error);
      return [];
    }

    // Filter out testimonials that don't have either an image_url or text_full
    return (data as Testimonial[]).filter(
      (testimonial) => testimonial.image_url || testimonial.text_full
    );
  } catch (error) {
    console.error('Exception fetching testimonials:', error);
    return [];
  }
};
