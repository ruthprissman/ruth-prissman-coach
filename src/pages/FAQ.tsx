
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import markdownit from 'markdown-it';

// Type for FAQ items
interface FAQItem {
  id: string;
  question: string;
  answer_markdown: string;
}

const md = markdownit({
  html: true,
  linkify: true,
  typographer: true,
});

export default function FAQ() {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('faq_questions')
          .select('*')
          .order('id');

        if (error) throw error;

        setFaqItems(data || []);
      } catch (err) {
        console.error('Error fetching FAQs:', err);
        setError('אירעה שגיאה בטעינת השאלות. אנא נסו שוב מאוחר יותר.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto pt-24 pb-16 px-4 md:px-8">
      <h1 className="text-3xl md:text-4xl font-alef text-[#4A235A] text-center mb-8">שאלות ותשובות</h1>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse flex flex-col w-full gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-md"></div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-8">{error}</div>
      ) : faqItems.length === 0 ? (
        <div className="text-center text-gray-500 py-8">לא נמצאו שאלות ותשובות.</div>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqItems.map((item) => (
            <AccordionItem 
              key={item.id} 
              value={item.id}
              className="border rounded-md px-4 py-1 border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <AccordionTrigger className="font-alef text-[#4A148C] text-right hover:text-purple-light py-4 text-lg">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="font-heebo text-right leading-relaxed">
                <div 
                  dangerouslySetInnerHTML={{ __html: md.render(item.answer_markdown) }} 
                  className="py-2 px-2 prose prose-sm max-w-none rtl:text-right"
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
