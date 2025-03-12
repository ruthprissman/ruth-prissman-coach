
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import markdownit from 'markdown-it';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Update interface to match database schema
interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// Initialize markdown parser
const md = markdownit({
  html: true,
  linkify: true,
  typographer: true,
});

export default function FAQ() {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error: supabaseError } = await supabase
          .from('faq_questions')
          .select('*')
          .order('id');

        if (supabaseError) {
          console.error('Supabase error:', supabaseError);
          throw supabaseError;
        }

        if (data && Array.isArray(data)) {
          setFaqItems(data);
        } else {
          console.warn('No FAQ data received or data is not an array', data);
          setFaqItems([]);
        }
      } catch (err) {
        console.error('Error fetching FAQs:', err);
        setError('אירעה שגיאה בטעינת השאלות. אנא נסו שוב מאוחר יותר.');
        toast({
          variant: "destructive",
          title: "שגיאה בטעינת נתונים",
          description: "לא ניתן לטעון את השאלות ותשובות כרגע. אנא נסו שוב מאוחר יותר.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFAQs();
  }, [toast]);

  // Safe markdown render function with validation - updated to use 'answer' field
  const renderMarkdown = (markdownText: string | null | undefined) => {
    if (!markdownText || typeof markdownText !== 'string' || markdownText.trim() === '') {
      return '<p class="text-gray-500 italic">לא קיימת תשובה זמינה כרגע.</p>';
    }
    
    try {
      return md.render(markdownText);
    } catch (err) {
      console.error('Error rendering markdown:', err);
      return '<p class="text-red-500">שגיאה בהצגת התוכן</p>';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div 
        className="min-h-screen bg-cover bg-center bg-fixed relative" 
        style={{ backgroundImage: 'url(https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/sign/site_imgs/clear-background.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJzaXRlX2ltZ3MvY2xlYXItYmFja2dyb3VuZC5wbmciLCJpYXQiOjE3NDExMDE0OTMsImV4cCI6MjM3MTgyMTQ5M30.k9JPVqmzmFtfxa8jbYpr1Hi3T4l2ZaHQZdPy2gGpgvk)' }}
      >
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]"></div>
        
        <Navigation />
        
        <main className="container mx-auto pt-24 pb-16 px-4 md:px-8 relative z-10">
          <h1 className="text-3xl md:text-4xl font-alef text-[#4A235A] text-center mb-8">שאלות ותשובות</h1>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-pulse flex flex-col w-full max-w-4xl mx-auto gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded-md"></div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : faqItems.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-lg font-medium">כרגע אין תוכן זמין בעמוד שאלות ותשובות.</p>
              <p className="mt-2">אנא בקרו שוב בקרוב או צרו קשר איתנו לקבלת מידע נוסף.</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={faqItems[0]?.id}>
                {faqItems.map((item) => (
                  <AccordionItem 
                    key={item.id} 
                    value={item.id}
                    className="border rounded-md px-4 py-1 border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <AccordionTrigger className="font-alef text-[#4A148C] text-right hover:text-purple-light py-4 text-lg">
                      {item.question || 'שאלה ללא כותרת'}
                    </AccordionTrigger>
                    <AccordionContent className="font-heebo text-right leading-relaxed">
                      <div 
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(item.answer) }} 
                        className="py-2 px-2 prose prose-sm max-w-none rtl:text-right"
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
