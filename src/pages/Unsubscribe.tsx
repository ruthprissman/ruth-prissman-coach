import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle, ArrowRight, Home } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Footer } from '@/components/Footer';
import { Navigation } from '@/components/Navigation';

const formSchema = z.object({
  email: z.string().email({ message: 'נא להזין כתובת אימייל תקינה' }),
  listType: z.enum(['general', 'stories', 'all'], {
    required_error: 'נא לבחור רשימת תפוצה',
  }),
});

type FormValues = z.infer<typeof formSchema>;

const listTypeNames: Record<string, string> = {
  general: 'תוכן כללי',
  stories: 'סיפורים קצרים',
  all: 'כל רשימות התפוצה',
};

const UnsubscribePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'input' | 'confirm' | 'success' | 'notFound' | 'resubscribed' | 'alreadyUnsubscribed'>('input');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: searchParams.get('email') || '',
      listType: (searchParams.get('list') as 'general' | 'stories' | 'all') || 'general',
    },
  });

  useEffect(() => {
    const email = searchParams.get('email');
    const list = searchParams.get('list');
    
    if (email) {
      form.setValue('email', email);
    }
    
    if (list && ['general', 'stories', 'all'].includes(list)) {
      form.setValue('listType', list as 'general' | 'stories' | 'all');
    }
  }, [searchParams, form]);

  const selectedListType = form.watch('listType');
  const selectedListName = listTypeNames[selectedListType] || '';

  const handleUnsubscribe = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      let isAlreadyUnsubscribed = false;
      let emailExists = false;
      
      if (values.listType === 'general' || values.listType === 'all') {
        const { data: generalData } = await supabase
          .from('content_subscribers')
          .select('email, is_subscribed')
          .eq('email', values.email)
          .maybeSingle();
          
        if (generalData) {
          emailExists = true;
          if (!generalData.is_subscribed) {
            isAlreadyUnsubscribed = true;
          }
        }
      }
      
      if (!emailExists && (values.listType === 'stories' || values.listType === 'all')) {
        const { data: storiesData } = await supabase
          .from('story_subscribers')
          .select('email, is_subscribed')
          .eq('email', values.email)
          .maybeSingle();
          
        if (storiesData) {
          emailExists = true;
          if (!storiesData.is_subscribed) {
            isAlreadyUnsubscribed = true;
          }
        }
      }
      
      if (!emailExists) {
        setStep('notFound');
        return;
      }
      
      if (isAlreadyUnsubscribed) {
        setStep('alreadyUnsubscribed');
        return;
      }
      
      if (values.listType === 'general' || values.listType === 'all') {
        const { error: generalError } = await supabase
          .from('content_subscribers')
          .update({ 
            is_subscribed: false, 
            unsubscribed_at: new Date().toISOString() 
          })
          .eq('email', values.email);
          
        if (generalError) throw generalError;
      }
      
      if (values.listType === 'stories' || values.listType === 'all') {
        const { error: storiesError } = await supabase
          .from('story_subscribers')
          .update({ 
            is_subscribed: false, 
            unsubscribed_at: new Date().toISOString() 
          })
          .eq('email', values.email);
          
        if (storiesError) throw storiesError;
      }
      
      setStep('success');
      toast.success('הסרת המנוי בוצעה בהצלחה');
      
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('אירעה שגיאה בתהליך ההסרה מרשימת התפוצה');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = () => {
    const values = form.getValues();
    const result = formSchema.safeParse(values);
    if (!result.success) {
      form.trigger();
      return;
    }
    
    setStep('confirm');
  };
  
  const handleResubscribe = async () => {
    setIsSubmitting(true);
    const values = form.getValues();
    
    try {
      if (values.listType === 'general' || values.listType === 'all') {
        const { data, error } = await supabase
          .from('content_subscribers')
          .select('id')
          .eq('email', values.email)
          .single();
          
        if (data) {
          await supabase
            .from('content_subscribers')
            .update({ 
              is_subscribed: true,
            })
            .eq('email', values.email);
        } else {
          await supabase
            .from('content_subscribers')
            .insert({ 
              email: values.email, 
              is_subscribed: true 
            });
        }
      }
      
      if (values.listType === 'stories' || values.listType === 'all') {
        const { data } = await supabase
          .from('story_subscribers')
          .select('id')
          .eq('email', values.email)
          .single();
          
        if (data) {
          await supabase
            .from('story_subscribers')
            .update({ 
              is_subscribed: true,
            })
            .eq('email', values.email);
        } else {
          await supabase
            .from('story_subscribers')
            .insert({ 
              email: values.email, 
              is_subscribed: true 
            });
        }
      }
      
      toast.success('נרשמת בהצלחה לרשימת התפוצה!');
      setStep('resubscribed');
    } catch (error) {
      console.error('Error resubscribing:', error);
      toast.error('אירעה שגיאה בתהליך ההרשמה');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col unsubscribe-page">
      <Navigation />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-md">
          <div className="bg-white/70 backdrop-blur-sm shadow-md rounded-lg p-8 mb-8">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-purple-600" />
              </div>
              <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
                {step === 'resubscribed' ? 'הרשמה מחדש לרשימת תפוצה' : 'הסרה מרשימת תפוצה'}
              </h1>
              <div className="w-16 h-1 bg-gold rounded-full"></div>
            </div>
            
            {step === 'input' && (
              <Form {...form}>
                <form className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>כתובת אימייל</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="הזן את כתובת האימייל שלך" 
                            {...field} 
                            dir="ltr"
                            className="text-left"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <FormLabel>בחר רשימת תפוצה:</FormLabel>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <input
                          type="radio"
                          id="general"
                          value="general"
                          checked={form.watch('listType') === 'general'}
                          onChange={() => form.setValue('listType', 'general')}
                          className="w-4 h-4 text-purple-600"
                        />
                        <label htmlFor="general" className="text-sm text-gray-700">תוכן כללי</label>
                      </div>
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <input
                          type="radio"
                          id="stories"
                          value="stories"
                          checked={form.watch('listType') === 'stories'}
                          onChange={() => form.setValue('listType', 'stories')}
                          className="w-4 h-4 text-purple-600"
                        />
                        <label htmlFor="stories" className="text-sm text-gray-700">סיפורים קצרים</label>
                      </div>
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <input
                          type="radio"
                          id="all"
                          value="all"
                          checked={form.watch('listType') === 'all'}
                          onChange={() => form.setValue('listType', 'all')}
                          className="w-4 h-4 text-purple-600"
                        />
                        <label htmlFor="all" className="text-sm text-gray-700">הסרה מכל הרשימות</label>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    onClick={handleConfirm}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                  >
                    המשך לאישור
                  </Button>
                </form>
              </Form>
            )}
            
            {step === 'confirm' && (
              <div className="space-y-6">
                <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 ml-2" />
                    <div>
                      <h3 className="font-medium text-amber-800">אישור הסרה מרשימת תפוצה</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        האם אתה בטוח שברצונך להסיר את המנוי לרשימת "<strong>{selectedListName}</strong>" עם האימייל:
                        <br />
                        <strong dir="ltr" className="inline-block mt-1">{form.getValues().email}</strong>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3 space-x-reverse">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep('input')}
                    className="flex-1"
                  >
                    חזרה
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => handleUnsubscribe(form.getValues())}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'מסיר...' : 'כן, הסר את המנוי שלי'}
                  </Button>
                </div>
              </div>
            )}
            
            {step === 'success' && (
              <div className="space-y-6">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    המנוי הוסר בהצלחה
                  </h3>
                  <p className="text-gray-600 mb-6">
                    המנוי שלך לרשימת "<strong>{selectedListName}</strong>" הוסר בהצלחה. 
                    <br />אנו מקווים לראות אותך שוב בעתיד! 😊
                  </p>
                  
                  <div className="space-y-3">
                    <Button 
                      type="button" 
                      onClick={handleResubscribe}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      disabled={isSubmitting}
                    >
                      <ArrowRight className="ml-2 h-4 w-4" />
                      {isSubmitting ? 'מבצע רישום...' : 'רוצה להצטרף חזרה? לחץ כאן להרשמה מחדש'}
                    </Button>
                    
                    <Link to="/">
                      <Button 
                        type="button" 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Home className="ml-2 h-4 w-4" />
                        חזרה לדף הבית
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {step === 'resubscribed' && (
              <div className="space-y-6">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    נרשמת בהצלחה!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    נרשמת בהצלחה לרשימת "<strong>{selectedListName}</strong>".
                    <br />אנו שמחים לראות אותך שוב! 😊
                  </p>
                  
                  <Link to="/">
                    <Button 
                      type="button" 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Home className="ml-2 h-4 w-4" />
                      חזרה לדף הבית
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            
            {step === 'alreadyUnsubscribed' && (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50/90 border border-blue-200 rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 ml-2" />
                    <div>
                      <h3 className="font-medium text-blue-800">כבר בוטל המנוי שלך</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        האימייל <strong dir="ltr" className="inline-block">{form.getValues().email}</strong> כבר אינו רשום לרשימת התפוצה "{selectedListName}".
                        <br />אין צורך בפעולה נוספת.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    type="button" 
                    onClick={handleResubscribe}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={isSubmitting}
                  >
                    <ArrowRight className="ml-2 h-4 w-4" />
                    {isSubmitting ? 'מבצע רישום...' : 'רוצה להצטרף חזרה? לחץ כאן להרשמה מחדש'}
                  </Button>
                  
                  <Link to="/">
                    <Button 
                      type="button" 
                      variant="outline"
                      className="w-full"
                    >
                      <Home className="ml-2 h-4 w-4" />
                      חזרה לדף הבית
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            
            {step === 'notFound' && (
              <div className="space-y-6">
                <div className="p-4 bg-red-50/90 border border-red-200 rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 ml-2" />
                    <div>
                      <h3 className="font-medium text-red-800">האימייל לא נמצא</h3>
                      <p className="text-sm text-red-700 mt-1">
                        האימייל <strong dir="ltr" className="inline-block">{form.getValues().email}</strong> לא רשום במערכת שלנו.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    type="button" 
                    onClick={() => setStep('input')}
                    className="w-full"
                  >
                    חזרה לטופס
                  </Button>
                  
                  <Link to="/">
                    <Button 
                      type="button" 
                      variant="outline"
                      className="w-full"
                    >
                      <Home className="ml-2 h-4 w-4" />
                      חזרה לדף הבית
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>לשאלות או בעיות, אנא <Link to="/contact" className="text-purple-600 hover:text-purple-700 underline">צור קשר</Link>.</p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default UnsubscribePage;
