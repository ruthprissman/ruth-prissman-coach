import React, { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import PublicLayout from '@/components/PublicLayout';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Spinner } from '@/components/Spinner';
import { useDocumentTitle } from '@/hooks/use-document-title';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  order_rank: number;
}

const FAQ = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useDocumentTitle('שאלות נפוצות');

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setIsLoading(true);
        const supabase = supabaseClient();
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .order('order_rank', { ascending: true });
      
        if (error) throw error;
      
        setFaqs(data || []);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        setError('אירעה שגיאה בטעינת השאלות הנפוצות');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFAQs();
  }, []);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout>
        <div className="text-red-500 text-center py-8">
          {error}
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4 text-center">שאלות נפוצות</h1>
        
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={String(faq.id)}>
              <AccordionTrigger className="text-lg font-semibold text-purple-700">{faq.question}</AccordionTrigger>
              <AccordionContent>
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </PublicLayout>
  );
};

export default FAQ;
