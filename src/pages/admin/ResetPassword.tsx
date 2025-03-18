import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KeyRound, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

const supabaseClient = supabase();

const formSchema = z.object({
  password: z.string().min(6, "סיסמה חייבת להיות לפחות 6 תווים"),
  confirmPassword: z.string().min(6, "סיסמה חייבת להיות לפחות 6 תווים"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "הסיסמאות אינן תואמות",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

const ResetPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: data.password,
      });
      
      if (error) throw error;
      
      toast({
        title: "סיסמה עודכנה בהצלחה",
        description: "✅ כעת תוכל/י להתחבר עם הסיסמה החדשה",
      });
      
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/admin/login');
      }, 3000);
    } catch (error: any) {
      toast({
        title: "עדכון סיסמה נכשל",
        description: `❌ ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <KeyRound className="w-12 h-12 text-purple-dark mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-purple-dark">הגדרת סיסמה חדשה</h1>
          <p className="text-gray-600 mt-2">אנא הזן את הסיסמה החדשה שלך</p>
        </div>
        
        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">הסיסמה עודכנה בהצלחה!</h2>
            <p className="text-gray-600 mb-4">מיד תועבר/י לדף ההתחברות...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-right block">סיסמה חדשה</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="הקלד סיסמה חדשה"
                          className="w-full text-right pr-10"
                          dir="rtl"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-right" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-right block">אימות סיסמה</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="הקלד שוב את הסיסמה החדשה"
                          className="w-full text-right pr-10"
                          dir="rtl"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-right" />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-[#4A235A] hover:bg-[#7E69AB] text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="mr-2">מעדכן סיסמה...</span>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  'עדכן סיסמה'
                )}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
